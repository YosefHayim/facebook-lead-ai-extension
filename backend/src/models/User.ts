import mongoose, { Schema, Document, Model } from 'mongoose';
import type { IUser, SubscriptionPlan, SubscriptionStatus } from '../types/index.js';
import { PLAN_LIMITS } from '../types/index.js';

export interface IUserDocument extends IUser, Document {
  isWithinLimits(type: 'leads' | 'aiCalls'): boolean;
  incrementUsage(type: 'leads' | 'aiCalls', amount?: number): Promise<void>;
  resetMonthlyUsage(): Promise<void>;
  updatePlan(plan: SubscriptionPlan): Promise<void>;
}

const userSchema = new Schema<IUserDocument>(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: String,
    avatarUrl: String,
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'pro', 'agency'] as SubscriptionPlan[],
        default: 'free',
      },
      status: {
        type: String,
        enum: ['active', 'cancelled', 'expired', 'past_due', 'paused'] as SubscriptionStatus[],
        default: 'active',
      },
      lemonSqueezyCustomerId: String,
      lemonSqueezySubscriptionId: String,
      currentPeriodEnd: Date,
      cancelAtPeriodEnd: {
        type: Boolean,
        default: false,
      },
    },
    usage: {
      leadsFoundThisMonth: {
        type: Number,
        default: 0,
      },
      aiCallsThisMonth: {
        type: Number,
        default: 0,
      },
      lastResetDate: {
        type: Date,
        default: () => new Date(),
      },
    },
    limits: {
      leadsPerMonth: {
        type: Number,
        default: PLAN_LIMITS.free.leadsPerMonth,
      },
      aiCallsPerMonth: {
        type: Number,
        default: PLAN_LIMITS.free.aiCallsPerMonth,
      },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.isWithinLimits = function (
  this: IUserDocument,
  type: 'leads' | 'aiCalls'
): boolean {
  if (type === 'leads') {
    return this.usage.leadsFoundThisMonth < this.limits.leadsPerMonth;
  }
  return this.usage.aiCallsThisMonth < this.limits.aiCallsPerMonth;
};

userSchema.methods.incrementUsage = async function (
  this: IUserDocument,
  type: 'leads' | 'aiCalls',
  amount = 1
): Promise<void> {
  if (type === 'leads') {
    this.usage.leadsFoundThisMonth += amount;
  } else {
    this.usage.aiCallsThisMonth += amount;
  }
  await this.save();
};

userSchema.methods.resetMonthlyUsage = async function (
  this: IUserDocument
): Promise<void> {
  this.usage.leadsFoundThisMonth = 0;
  this.usage.aiCallsThisMonth = 0;
  this.usage.lastResetDate = new Date();
  await this.save();
};

userSchema.methods.updatePlan = async function (
  this: IUserDocument,
  plan: SubscriptionPlan
): Promise<void> {
  this.subscription.plan = plan;
  this.limits.leadsPerMonth = PLAN_LIMITS[plan].leadsPerMonth;
  this.limits.aiCallsPerMonth = PLAN_LIMITS[plan].aiCallsPerMonth;
  await this.save();
};

userSchema.statics.findByGoogleId = function (
  googleId: string
): Promise<IUserDocument | null> {
  return this.findOne({ googleId });
};

userSchema.statics.findByLemonSqueezyCustomerId = function (
  customerId: string
): Promise<IUserDocument | null> {
  return this.findOne({ 'subscription.lemonSqueezyCustomerId': customerId });
};

userSchema.statics.findByLemonSqueezySubscriptionId = function (
  subscriptionId: string
): Promise<IUserDocument | null> {
  return this.findOne({ 'subscription.lemonSqueezySubscriptionId': subscriptionId });
};

export interface IUserModel extends Model<IUserDocument> {
  findByGoogleId(googleId: string): Promise<IUserDocument | null>;
  findByLemonSqueezyCustomerId(customerId: string): Promise<IUserDocument | null>;
  findByLemonSqueezySubscriptionId(subscriptionId: string): Promise<IUserDocument | null>;
}

export const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);
