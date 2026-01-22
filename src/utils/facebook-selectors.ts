export const FB_SELECTORS = {
  feedUnit: '[data-pagelet^="FeedUnit"]',
  postMessage: '[data-ad-preview="message"]',
  groupFeed: '[data-pagelet="GroupFeed"]',
  stories: '[data-pagelet="Stories"]',
  postContainer: '[role="article"]',
  commentBox: '[contenteditable="true"]',
  authorLink: 'a[role="link"][tabindex="0"]',
  postTimestamp: 'a[role="link"] span[id]',
  feedRoot: '[role="feed"]',
  mainContent: '[role="main"]',
} as const;

export function getPostId(element: Element): string | null {
  const article = element.closest('[role="article"]');
  if (!article) return null;
  
  const links = article.querySelectorAll('a[href*="/posts/"], a[href*="story_fbid"]');
  for (const link of links) {
    const href = link.getAttribute('href');
    if (href) {
      const postIdMatch = href.match(/posts\/(\d+)|story_fbid=(\d+)/);
      if (postIdMatch) {
        return postIdMatch[1] || postIdMatch[2];
      }
    }
  }
  
  const dataId = article.getAttribute('data-id') || article.id;
  if (dataId) return dataId;
  
  const textContent = article.textContent?.slice(0, 100) || '';
  return `post-${hashString(textContent)}`;
}

export function getPostUrl(element: Element): string {
  const article = element.closest('[role="article"]');
  if (!article) return window.location.href;
  
  const links = article.querySelectorAll('a[href*="/posts/"], a[href*="story_fbid"], a[href*="/groups/"][href*="/permalink/"]');
  for (const link of links) {
    const href = link.getAttribute('href');
    if (href && !href.includes('/user/') && !href.includes('/profile.php')) {
      if (href.startsWith('/')) {
        return `https://www.facebook.com${href}`;
      }
      return href;
    }
  }
  
  return window.location.href;
}

export function getAuthorInfo(element: Element): { name: string; profileUrl: string } {
  const article = element.closest('[role="article"]');
  if (!article) return { name: 'Unknown', profileUrl: '' };
  
  const authorLinks = article.querySelectorAll('a[role="link"]');
  for (const link of authorLinks) {
    const href = link.getAttribute('href') || '';
    const isProfileLink = 
      href.includes('/profile.php') || 
      (href.startsWith('/') && !href.includes('/posts/') && !href.includes('/groups/') && href.split('/').filter(Boolean).length === 1);
    
    if (isProfileLink) {
      const name = link.textContent?.trim() || 'Unknown';
      const profileUrl = href.startsWith('/') ? `https://www.facebook.com${href}` : href;
      return { name, profileUrl };
    }
  }
  
  return { name: 'Unknown', profileUrl: '' };
}

export function getPostText(element: Element): string {
  const article = element.closest('[role="article"]');
  if (!article) return '';
  
  const messageEl = article.querySelector(FB_SELECTORS.postMessage);
  if (messageEl) {
    return cleanPostText(messageEl.textContent || '');
  }
  
  const textDivs = article.querySelectorAll('[dir="auto"]');
  const texts: string[] = [];
  
  for (const div of textDivs) {
    const text = div.textContent?.trim();
    if (text && text.length > 20 && !isUIText(text)) {
      texts.push(text);
    }
  }
  
  return cleanPostText(texts.join(' '));
}

export function getGroupName(): string | undefined {
  const groupHeader = document.querySelector('[data-pagelet="GroupProfileHeader"] h1');
  if (groupHeader) {
    return groupHeader.textContent?.trim();
  }
  
  const breadcrumb = document.querySelector('a[href*="/groups/"][role="link"]');
  if (breadcrumb) {
    return breadcrumb.textContent?.trim();
  }
  
  return undefined;
}

function cleanPostText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/See more|See less|Like|Comment|Share|Reply/gi, '')
    .trim()
    .slice(0, 2000);
}

function isUIText(text: string): boolean {
  const uiPatterns = [
    /^(Like|Comment|Share|Reply|See more|See less)$/i,
    /^\d+ (likes?|comments?|shares?)$/i,
    /^(Public|Friends|Only me)$/i,
    /^\d+[hmd]$/,
  ];
  
  return uiPatterns.some(pattern => pattern.test(text.trim()));
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
