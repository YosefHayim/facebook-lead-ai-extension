export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(timestamp);
}

export function extractFacebookGroupId(url: string): string | null {
  const match = url.match(/facebook\.com\/groups\/([^/?]+)/);
  return match ? match[1] : null;
}

export function generateFacebookSearchUrl(groupId: string, query: string): string {
  return `https://www.facebook.com/groups/${groupId}/search?q=${encodeURIComponent(query.trim())}`;
}
