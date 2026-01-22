import type { ParsedPost, ScanResult } from '../../src/types';
import { FB_SELECTORS, getPostId, getPostUrl, getAuthorInfo, getPostText, getGroupName } from '../../src/utils/facebook-selectors';
import { debounce, randomDelay, createRateLimiter } from '../../src/utils/human-mimicry';
import { 
  seenPostIdsStorage, 
  getActivePersona, 
  addLead, 
  incrementUsage, 
  settingsStorage,
  checkSessionLimits,
  incrementSessionUsage 
} from '../../src/lib/storage';
import { classifyPostIntent, generatePostReply } from '../../src/lib/ai';

const rateLimiter = createRateLimiter(5, 60000);
const seenPosts = new Set<string>();

export async function manualScanPage(): Promise<ScanResult> {
  const result: ScanResult = {
    postsFound: 0,
    leadsDetected: 0,
    errors: [],
    timestamp: Date.now(),
  };

  try {
    const limitCheck = await checkSessionLimits();
    if (!limitCheck.canProceed) {
      result.errors.push(limitCheck.reason || 'Session limit reached');
      return result;
    }

    const settings = await settingsStorage.getValue();
    if (!settings.isEnabled) {
      result.errors.push('Extension is disabled');
      return result;
    }

    const savedSeenIds = await seenPostIdsStorage.getValue();
    savedSeenIds.forEach(id => seenPosts.add(id));

    const feedUnits = document.querySelectorAll(FB_SELECTORS.feedUnit);
    const articles = document.querySelectorAll(FB_SELECTORS.postContainer);
    const postElements = [...new Set([...feedUnits, ...articles])];

    result.postsFound = postElements.length;

    for (const element of postElements) {
      const postId = getPostId(element);
      if (!postId || seenPosts.has(postId)) continue;

      seenPosts.add(postId);

      const postText = getPostText(element);
      if (postText.length < 30) continue;

      const parsedPost: ParsedPost = {
        id: postId,
        text: postText,
        ...getAuthorInfo(element),
        postUrl: getPostUrl(element),
        groupName: getGroupName(),
        element: element as HTMLElement,
      };

      const shouldProcess = await shouldProcessPost(parsedPost);
      if (!shouldProcess) continue;

      await rateLimiter.consume();
      await randomDelay(300, 800);

      try {
        if (settings.autoAnalyze) {
          const wasAdded = await analyzeAndSavePost(parsedPost, settings.minLeadScore);
          if (wasAdded) result.leadsDetected++;
        } else {
          await savePostWithoutAnalysis(parsedPost);
          result.leadsDetected++;
        }
        
        await incrementSessionUsage('post');
        notifyNewLead(parsedPost);
      } catch (error) {
        result.errors.push(`Failed to process post ${postId}: ${error}`);
      }
    }

    await seenPostIdsStorage.setValue([...seenPosts].slice(-1000));
  } catch (error) {
    result.errors.push(`Scan failed: ${error}`);
  }

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
      
      const savedSeenIds = await seenPostIdsStorage.getValue();
      savedSeenIds.forEach(id => seenPosts.add(id));
      
      const feedUnits = document.querySelectorAll(FB_SELECTORS.feedUnit);
      const articles = document.querySelectorAll(FB_SELECTORS.postContainer);
      const postElements = new Set([...feedUnits, ...articles]);
      
      for (const element of postElements) {
        const postId = getPostId(element);
        if (!postId || seenPosts.has(postId)) continue;
        
        seenPosts.add(postId);
        
        const postText = getPostText(element);
        if (postText.length < 30) continue;
        
        const parsedPost: ParsedPost = {
          id: postId,
          text: postText,
          ...getAuthorInfo(element),
          postUrl: getPostUrl(element),
          groupName: getGroupName(),
          element: element as HTMLElement,
        };
        
        if (await shouldProcessPost(parsedPost)) {
          await rateLimiter.consume();
          await randomDelay(500, 1500);
          
          if (settings.autoAnalyze) {
            await analyzeAndSavePost(parsedPost, settings.minLeadScore);
          } else {
            await savePostWithoutAnalysis(parsedPost);
          }
          
          await incrementSessionUsage('post');
          onNewPost(parsedPost);
          notifyNewLead(parsedPost);
        }
      }
      
      await seenPostIdsStorage.setValue([...seenPosts].slice(-1000));
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

async function shouldProcessPost(post: ParsedPost): Promise<boolean> {
  const persona = await getActivePersona();
  if (!persona) return false;
  
  const textLower = post.text.toLowerCase();
  
  const hasNegativeKeyword = persona.negativeKeywords.some(kw => 
    textLower.includes(kw.toLowerCase())
  );
  if (hasNegativeKeyword) return false;
  
  const hasKeyword = persona.keywords.some(kw => 
    textLower.includes(kw.toLowerCase())
  );
  
  return hasKeyword;
}

async function analyzeAndSavePost(post: ParsedPost, minLeadScore: number): Promise<boolean> {
  try {
    const persona = await getActivePersona();
    if (!persona) return false;
    
    const analysis = await classifyPostIntent(post.text, persona);
    
    if (analysis.leadScore < minLeadScore) return false;
    if (analysis.intent === 'irrelevant' || analysis.intent === 'selling') return false;
    
    let draftReply: string | undefined;
    if (analysis.intent === 'seeking_service' || analysis.intent === 'recommendation' || analysis.intent === 'complaining') {
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
    
    return true;
  } catch (error) {
    console.error('[LeadScout] Error analyzing post:', error);
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
