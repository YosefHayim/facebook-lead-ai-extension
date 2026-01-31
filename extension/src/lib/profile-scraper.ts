import type { LeadContextIntelligence, ProfileActivity } from '../types';
import { randomDelay } from '../utils/human-mimicry';

export async function scrapeProfileData(profileUrl: string): Promise<LeadContextIntelligence | null> {
  try {
    await randomDelay(1000, 2000);
    
    const response = await fetch(profileUrl, {
      credentials: 'include',
      headers: {
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch profile:', response.status);
      return null;
    }

    const html = await response.text();
    return parseProfileHtml(html);
  } catch (error) {
    console.error('Error scraping profile:', error);
    return null;
  }
}

function parseProfileHtml(html: string): LeadContextIntelligence {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  
  const lci: LeadContextIntelligence = {
    fetchedAt: Date.now(),
    confidenceScore: 0,
  };

  lci.profileName = extractProfileName(doc);
  lci.profileBio = extractProfileBio(doc);
  lci.location = extractLocation(doc);
  lci.workplace = extractWorkplace(doc);
  lci.education = extractEducation(doc);
  lci.recentActivity = extractRecentActivity(doc);
  
  lci.confidenceScore = calculateConfidenceScore(lci);

  return lci;
}

function extractProfileName(doc: Document): string | undefined {
  const selectors = [
    'h1[data-testid="profile_name"]',
    'h1.x1heor9g',
    '[role="main"] h1',
    'title',
  ];

  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    if (element?.textContent) {
      const name = element.textContent.trim();
      if (name && !name.includes('Facebook') && name.length < 100) {
        return name;
      }
    }
  }
  return undefined;
}

function extractProfileBio(doc: Document): string | undefined {
  const selectors = [
    '[data-testid="profile_intro_card_bio"]',
    '[data-testid="intro_card_bio"]',
    '.x1heor9g.x1qlqyl8.x1pd3egz',
  ];

  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    if (element?.textContent) {
      const bio = element.textContent.trim();
      if (bio && bio.length > 5 && bio.length < 500) {
        return bio;
      }
    }
  }
  return undefined;
}

function extractLocation(doc: Document): string | undefined {
  const locationPatterns = [
    /Lives in (.+?)(?:\n|$)/i,
    /From (.+?)(?:\n|$)/i,
    /Located in (.+?)(?:\n|$)/i,
  ];

  const text = doc.body?.textContent || '';
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const location = match[1].trim();
      if (location.length < 100) {
        return location;
      }
    }
  }
  return undefined;
}

function extractWorkplace(doc: Document): string | undefined {
  const workPatterns = [
    /Works at (.+?)(?:\n|$)/i,
    /Worked at (.+?)(?:\n|$)/i,
    /(?:CEO|Founder|Owner|Manager|Director) (?:at|of) (.+?)(?:\n|$)/i,
  ];

  const text = doc.body?.textContent || '';
  
  for (const pattern of workPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const workplace = match[1].trim();
      if (workplace.length < 100) {
        return workplace;
      }
    }
  }
  return undefined;
}

function extractEducation(doc: Document): string | undefined {
  const eduPatterns = [
    /Studied at (.+?)(?:\n|$)/i,
    /Went to (.+?)(?:\n|$)/i,
    /(?:University|College|School) of (.+?)(?:\n|$)/i,
  ];

  const text = doc.body?.textContent || '';
  
  for (const pattern of eduPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const education = match[1].trim();
      if (education.length < 100) {
        return education;
      }
    }
  }
  return undefined;
}

function extractRecentActivity(doc: Document): ProfileActivity[] {
  const activities: ProfileActivity[] = [];
  
  const postElements = doc.querySelectorAll('[data-testid="post_message"], [data-ad-preview="message"]');
  
  postElements.forEach((element, index) => {
    if (index >= 5) return;
    
    const text = element.textContent?.trim();
    if (text && text.length > 10) {
      activities.push({
        type: 'post',
        text: text.substring(0, 200),
        timestamp: Date.now() - (index * 86400000),
      });
    }
  });

  return activities;
}

function calculateConfidenceScore(lci: LeadContextIntelligence): number {
  let score = 0;
  const maxScore = 100;

  if (lci.profileName) score += 15;
  if (lci.profileBio) score += 20;
  if (lci.location) score += 15;
  if (lci.workplace) score += 20;
  if (lci.education) score += 10;
  if (lci.recentActivity && lci.recentActivity.length > 0) score += 10;
  if (lci.interests && lci.interests.length > 0) score += 5;
  if (lci.contactInfo?.email || lci.contactInfo?.website) score += 5;

  return Math.min(score, maxScore);
}

export async function fetchLCIForLead(
  leadId: string,
  profileUrl: string
): Promise<{ leadId: string; lci: LeadContextIntelligence | null }> {
  const lci = await scrapeProfileData(profileUrl);
  return { leadId, lci };
}

export function formatLCISummary(lci: LeadContextIntelligence): string {
  const parts: string[] = [];

  if (lci.profileName) {
    parts.push(`Name: ${lci.profileName}`);
  }

  if (lci.workplace) {
    parts.push(`Works: ${lci.workplace}`);
  }

  if (lci.location) {
    parts.push(`Location: ${lci.location}`);
  }

  if (lci.education) {
    parts.push(`Education: ${lci.education}`);
  }

  if (lci.profileBio) {
    parts.push(`Bio: ${lci.profileBio.substring(0, 100)}${lci.profileBio.length > 100 ? '...' : ''}`);
  }

  return parts.join(' | ');
}
