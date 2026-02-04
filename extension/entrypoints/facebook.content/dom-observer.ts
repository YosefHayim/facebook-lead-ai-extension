import type { ParsedPost, ScanResult, ExtensionSettings } from '../../src/types';
import { FB_SELECTORS, getPostId, getPostUrl, getAuthorInfo, getPostText, getGroupName } from '../../src/utils/facebook-selectors';
import { debounce, randomDelay, createRateLimiter } from '../../src/utils/human-mimicry';
import {
  seenPostIdsStorage,
  getActivePersona,
  addLead,
  incrementUsage,
  settingsStorage,
  checkSessionLimits,
  incrementSessionUsage,
} from '../../src/lib/storage';
import { classifyPostIntent, generatePostReply } from '../../src/lib/ai';
import { logger } from '../../src/utils/logger';

const rateLimiter = createRateLimiter(5, 60000);
const seenPosts = new Set<string>();

type ProcessedPost = {
  parsedPost: ParsedPost;
  leadAdded: boolean;
};

export async function manualScanPage(): Promise<ScanResult> {
  const result: ScanResult = {
    postsFound: 0,
    leadsDetected: 0,
    errors: [],
    timestamp: Date.now(),
  };

  logger.logScan('start', { url: window.location.href });

  try {
    const limitCheck = await checkSessionLimits();
    if (!limitCheck.canProceed) {
      logger.scan.warn('Session limit reached', { reason: limitCheck.reason });
      result.errors.push(limitCheck.reason || 'Session limit reached');
      return result;
    }

    const settings = await settingsStorage.getValue();
    if (!settings.isEnabled) {
      logger.scan.warn('Extension is disabled');
      result.errors.push('Extension is disabled');
      return result;
    }

    await hydrateSeenPosts();

    const postElements = getPostElements(true);
    result.postsFound = postElements.length;
    logger.scan.info(`Found ${postElements.length} post elements`, { seenCount: seenPosts.size });

    for (const element of postElements) {
      try {
        const processed = await processPostElement(element, settings, settings.minLeadScore);
        if (!processed) continue;

        if (processed.leadAdded) {
          result.leadsDetected++;
          logger.scan.info('Lead detected and saved', {
            postId: processed.parsedPost.id,
            authorName: processed.parsedPost.authorName,
          });
        }

        await incrementSessionUsage('post');
        notifyNewLead(processed.parsedPost);
      } catch (error) {
        const postId = getPostId(element) || 'unknown';
        logger.scan.error('Failed to process post', { postId, error });
        result.errors.push(`Failed to process post ${postId}: ${error}`);
      }
    }

    await persistSeenPosts();
  } catch (error) {
    logger.logScan('error', { error });
    result.errors.push(`Scan failed: ${error}`);
  }

  logger.logScan('complete', result);
  return result;
}

export function setupAutoScanObserver(onNewPost: (post: ParsedPost) => void): () => void {
  let isProcessing = false;

  const processNewPosts = debounce(async () => {
    if (isProcessing || document.hidden) return;
    isProcessing = true;

    try {
      const settings = await settingsStorage.getValue();
      if (!settings.isEnabled || settings.scanMode !== 'auto') return;

      const limitCheck = await checkSessionLimits();
      if (!limitCheck.canProceed) return;

      await hydrateSeenPosts();

      const postElements = getPostElements(false);

      for (const element of postElements) {
        const processed = await processPostElement(element, settings, settings.minLeadScore);
        if (!processed) continue;

        await incrementSessionUsage('post');
        onNewPost(processed.parsedPost);
        notifyNewLead(processed.parsedPost);
      }

      await persistSeenPosts();
    } finally {
      isProcessing = false;
    }
  }, 10000);

  const observer = new MutationObserver(() => {
    if (!document.hidden) {
      processNewPosts();
    }
  });

  const feedRoot = document.querySelector(FB_SELECTORS.feedRoot) ||
    document.querySelector(FB_SELECTORS.mainContent) ||
    document.body;

  observer.observe(feedRoot, {
    childList: true,
    subtree: true,
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      processNewPosts();
    }
  });

  return () => observer.disconnect();
}

function getPostElements(logSelectors: boolean): Element[] {
  const feedUnits = document.querySelectorAll(FB_SELECTORS.feedUnit);
  const articles = document.querySelectorAll(FB_SELECTORS.postContainer);
  const postElements = [...new Set([...feedUnits, ...articles])];

  if (logSelectors) {
    logger.logSelector(feedUnits.length > 0 ? 'found' : 'not_found', FB_SELECTORS.feedUnit, feedUnits.length);
    logger.logSelector(articles.length > 0 ? 'found' : 'not_found', FB_SELECTORS.postContainer, articles.length);
  }

  return postElements;
}

async function hydrateSeenPosts(): Promise<void> {
  if (seenPosts.size > 0) return;
  const savedSeenIds = await seenPostIdsStorage.getValue();
  savedSeenIds.forEach((id) => seenPosts.add(id));
}

async function persistSeenPosts(): Promise<void> {
  await seenPostIdsStorage.setValue([...seenPosts].slice(-1000));
}

async function processPostElement(
  element: Element,
  settings: ExtensionSettings,
  minLeadScore: number
): Promise<ProcessedPost | null> {
  const postId = getPostId(element);
  if (!postId || seenPosts.has(postId)) return null;

  seenPosts.add(postId);

  const postText = getPostText(element);
  if (postText.length < 30) {
    logger.selector.debug('Post text too short, skipping', { postId, length: postText.length });
    return null;
  }

  const parsedPost: ParsedPost = {
    id: postId,
    text: postText,
    ...getAuthorInfo(element),
    postUrl: getPostUrl(element),
    groupName: getGroupName(),
    element: element as HTMLElement,
  };

  logger.selector.debug('Parsed post', {
    postId,
    authorName: parsedPost.authorName,
    textLength: postText.length,
    hasUrl: !!parsedPost.postUrl,
  });

  const shouldProcess = await shouldProcessPost(parsedPost);
  if (!shouldProcess) {
    logger.scan.debug('Post filtered out by keywords', { postId });
    return null;
  }

  await rateLimiter.consume();
  await randomDelay(settings.scanMode === 'auto' ? 500 : 300, settings.scanMode === 'auto' ? 1500 : 800);

  let leadAdded = false;
  if (settings.autoAnalyze) {
    leadAdded = await analyzeAndSavePost(parsedPost, minLeadScore);
  } else {
    await savePostWithoutAnalysis(parsedPost);
    leadAdded = true;
  }

  return { parsedPost, leadAdded };
}

async function shouldProcessPost(post: ParsedPost): Promise<boolean> {
  const persona = await getActivePersona();
  if (!persona) return false;

  const textLower = post.text.toLowerCase();

  const hasNegativeKeyword = persona.negativeKeywords.some((kw) =>
    textLower.includes(kw.toLowerCase())
  );
  if (hasNegativeKeyword) return false;

  const hasKeyword = persona.keywords.some((kw) =>
    textLower.includes(kw.toLowerCase())
  );

  return hasKeyword;
}

async function analyzeAndSavePost(post: ParsedPost, minLeadScore: number): Promise<boolean> {
  try {
    const persona = await getActivePersona();
    if (!persona) {
      logger.scan.warn('No active persona found');
      return false;
    }

    logger.ai.info('Analyzing post', { postId: post.id, personaId: persona.id });

    const analysis = await classifyPostIntent(post.text, persona);

    logger.ai.debug('Analysis result', {
      postId: post.id,
      intent: analysis.intent,
      leadScore: analysis.leadScore,
      confidence: analysis.confidence,
    });

    if (analysis.leadScore < minLeadScore) {
      logger.scan.debug('Lead score below threshold', {
        postId: post.id,
        score: analysis.leadScore,
        threshold: minLeadScore,
      });
      return false;
    }

    if (analysis.intent === 'irrelevant' || analysis.intent === 'selling') {
      logger.scan.debug('Post filtered by intent', { postId: post.id, intent: analysis.intent });
      return false;
    }

    let draftReply: string | undefined;
    if (analysis.intent === 'seeking_service' || analysis.intent === 'recommendation' || analysis.intent === 'complaining') {
      logger.ai.info('Generating reply for high-intent post', { postId: post.id, intent: analysis.intent });
      draftReply = await generatePostReply(post.text, analysis, persona);
    }

    await incrementUsage('lead');

    await addLead({
      id: post.id,
      personaId: persona.id,
      postUrl: post.postUrl,
      postText: post.text,
      authorName: post.authorName,
      authorProfileUrl: post.authorProfileUrl,
      groupName: post.groupName,
      intent: analysis.intent,
      leadScore: analysis.leadScore,
      aiAnalysis: analysis,
      aiDraftReply: draftReply,
      status: 'new',
      createdAt: Date.now(),
    });

    logger.storage.info('Lead saved', {
      postId: post.id,
      intent: analysis.intent,
      leadScore: analysis.leadScore,
      hasReply: !!draftReply,
    });

    return true;
  } catch (error) {
    logger.scan.error('Error analyzing post', { postId: post.id, error });
    return false;
  }
}

async function savePostWithoutAnalysis(post: ParsedPost): Promise<void> {
  const persona = await getActivePersona();
  if (!persona) return;

  await addLead({
    id: post.id,
    personaId: persona.id,
    postUrl: post.postUrl,
    postText: post.text,
    authorName: post.authorName,
    authorProfileUrl: post.authorProfileUrl,
    groupName: post.groupName,
    intent: 'discussion',
    leadScore: 50,
    status: 'new',
    createdAt: Date.now(),
  });
}

function notifyNewLead(post: ParsedPost): void {
  window.dispatchEvent(new CustomEvent('leadscout:newlead', {
    detail: { postId: post.id },
  }));
}

export function getCurrentPageInfo(): { isGroup: boolean; groupName?: string; url: string } {
  const url = window.location.href;
  const isGroup = url.includes('/groups/');
  const groupName = getGroupName();

  return { isGroup, groupName, url };
}
