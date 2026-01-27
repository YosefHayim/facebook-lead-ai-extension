import mongoose, { Schema, Document, Model } from 'mongoose';
import type { ILead, IntentType, LeadStatus } from '../types/index.js';

export interface ILeadDocument extends ILead, Document {}

const leadSchema = new Schema<ILeadDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    postUrl: {
      type: String,
      required: true,
    },
    postText: {
      type: String,
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    authorProfileUrl: {
      type: String,
      required: true,
    },
    groupName: String,
    intent: {
      type: String,
      enum: [
        'seeking_service',
        'hiring',
        'complaining',
        'recommendation',
        'discussion',
        'selling',
        'irrelevant',
      ] as IntentType[],
      required: true,
    },
    leadScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    aiAnalysis: {
      intent: {
        type: String,
        enum: [
          'seeking_service',
          'hiring',
          'complaining',
          'recommendation',
          'discussion',
          'selling',
          'irrelevant',
        ] as IntentType[],
      },
      confidence: Number,
      reasoning: String,
      keywords: [String],
    },
    aiDraftReply: String,
    status: {
      type: String,
      enum: ['new', 'contacted', 'converted', 'ignored'] as LeadStatus[],
      default: 'new',
    },
    responseTracking: {
      responded: {
        type: Boolean,
        default: false,
      },
      responseText: String,
      respondedAt: Date,
      gotReply: Boolean,
      repliedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

leadSchema.index({ userId: 1, createdAt: -1 });
leadSchema.index({ userId: 1, status: 1 });
leadSchema.index({ userId: 1, intent: 1 });

leadSchema.statics.findByUserId = function (
  userId: string,
  options?: { status?: LeadStatus; limit?: number; skip?: number }
): Promise<ILeadDocument[]> {
  const query = this.find({ userId });
  
  if (options?.status) {
    query.where('status', options.status);
  }
  
  if (options?.skip) {
    query.skip(options.skip);
  }
  
  if (options?.limit) {
    query.limit(options.limit);
  }
  
  return query.sort({ createdAt: -1 }).exec();
};

leadSchema.statics.countByUserId = function (
  userId: string,
  options?: { status?: LeadStatus; since?: Date }
): Promise<number> {
  const query: Record<string, unknown> = { userId };
  
  if (options?.status) {
    query.status = options.status;
  }
  
  if (options?.since) {
    query.createdAt = { $gte: options.since };
  }
  
  return this.countDocuments(query);
};

export interface ILeadModel extends Model<ILeadDocument> {
  findByUserId(
    userId: string,
    options?: { status?: LeadStatus; limit?: number; skip?: number }
  ): Promise<ILeadDocument[]>;
  countByUserId(
    userId: string,
    options?: { status?: LeadStatus; since?: Date }
  ): Promise<number>;
}

export const Lead = mongoose.model<ILeadDocument, ILeadModel>('Lead', leadSchema);
