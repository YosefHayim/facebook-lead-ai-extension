import { User } from '../models/User.js';

export async function getUsage(userId: string) {
  const user = await User.findById(userId);
  if (!user) return null;
  return {
    usage: user.usage,
    limits: user.limits,
    plan: user.subscription.plan,
  };
}

export async function incrementUsage(userId: string, type: 'leads' | 'aiCalls', amount = 1) {
  const user = await User.findById(userId);
  if (!user) return { error: 'User not found' as const };
  if (!User.isWithinLimits(user, type)) {
    return { error: `Monthly ${type} limit reached` as const };
  }
  await User.incrementUsage(user.id, type, amount);
  const updatedUser = await User.findById(user.id);
  return {
    usage: updatedUser?.usage,
    limits: updatedUser?.limits,
  };
}

export async function checkUsageLimit(userId: string, type: 'leads' | 'aiCalls') {
  const user = await User.findById(userId);
  if (!user) return null;
  const withinLimits = User.isWithinLimits(user, type);
  const current = type === 'leads' ? user.usage.leadsFoundThisMonth : user.usage.aiCallsThisMonth;
  const limit = type === 'leads' ? user.limits.leadsPerMonth : user.limits.aiCallsPerMonth;
  return {
    allowed: withinLimits,
    current,
    limit,
    remaining: Math.max(0, limit - current),
  };
}
