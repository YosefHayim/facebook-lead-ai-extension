import mongoose, { Schema, Document, Model } from 'mongoose';
import type { IWatchedGroup } from '../types/index.js';

export interface IWatchedGroupDocument extends IWatchedGroup, Document {}

const watchedGroupSchema = new Schema<IWatchedGroupDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: 'general',
      trim: true,
    },
    lastVisited: Date,
    leadsFound: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

watchedGroupSchema.index({ userId: 1, isActive: 1 });
watchedGroupSchema.index({ userId: 1, url: 1 }, { unique: true });

watchedGroupSchema.statics.findByUserId = function (
  userId: string,
  options?: { activeOnly?: boolean }
): Promise<IWatchedGroupDocument[]> {
  const query: Record<string, unknown> = { userId };

  if (options?.activeOnly) {
    query.isActive = true;
  }

  return this.find(query).sort({ lastVisited: -1 }).exec();
};

watchedGroupSchema.statics.findNextToVisit = function (
  userId: string
): Promise<IWatchedGroupDocument | null> {
  return this.findOne({ userId, isActive: true })
    .sort({ lastVisited: 1 })
    .exec();
};

watchedGroupSchema.statics.incrementLeadsFound = async function (
  groupId: string,
  count = 1
): Promise<void> {
  await this.findByIdAndUpdate(groupId, {
    $inc: { leadsFound: count },
    $set: { lastVisited: new Date() },
  });
};

export interface IWatchedGroupModel extends Model<IWatchedGroupDocument> {
  findByUserId(
    userId: string,
    options?: { activeOnly?: boolean }
  ): Promise<IWatchedGroupDocument[]>;
  findNextToVisit(userId: string): Promise<IWatchedGroupDocument | null>;
  incrementLeadsFound(groupId: string, count?: number): Promise<void>;
}

export const WatchedGroup = mongoose.model<IWatchedGroupDocument, IWatchedGroupModel>(
  'WatchedGroup',
  watchedGroupSchema
);
