import { WatchedGroup } from '../models/WatchedGroup.js';

export async function listGroups(userId: string, activeOnly?: boolean) {
  return WatchedGroup.findByUserId(userId, { activeOnly });
}

export async function createGroup(userId: string, data: {
  name: string;
  url: string;
  category?: string;
  isActive?: boolean;
}) {
  const existing = await WatchedGroup.findByUrl(userId, data.url);
  if (existing) return { error: 'Group already exists' as const, group: existing };
  const group = await WatchedGroup.create({ ...data, userId });
  return { group };
}

export async function getGroupById(userId: string, groupId: string) {
  const group = await WatchedGroup.findById(groupId);
  if (!group || group.userId !== userId) return null;
  return group;
}

export async function updateGroup(userId: string, groupId: string, updates: Partial<{
  name: string;
  url: string;
  category: string;
  lastVisited: Date;
  leadsFound: number;
  isActive: boolean;
}>) {
  const existing = await WatchedGroup.findById(groupId);
  if (!existing || existing.userId !== userId) return null;
  return WatchedGroup.update(groupId, updates);
}

export async function recordGroupVisit(userId: string, groupId: string, leadsFound = 0) {
  const existing = await WatchedGroup.findById(groupId);
  if (!existing || existing.userId !== userId) return null;
  await WatchedGroup.incrementLeadsFound(groupId, leadsFound);
  return WatchedGroup.findById(groupId);
}

export async function getNextGroupToVisit(userId: string) {
  return WatchedGroup.findNextToVisit(userId);
}

export async function deleteGroup(userId: string, groupId: string) {
  const existing = await WatchedGroup.findById(groupId);
  if (!existing || existing.userId !== userId) return false;
  return WatchedGroup.delete(groupId);
}
