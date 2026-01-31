import mongoose, { Schema, Document, Model } from 'mongoose';
import type { IPersona, AITone } from '../types/index.js';

export interface IPersonaDocument extends IPersona, Document {}

const personaSchema = new Schema<IPersonaDocument>(
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
    role: {
      type: String,
      required: true,
      trim: true,
    },
    keywords: {
      type: [String],
      default: [],
    },
    negativeKeywords: {
      type: [String],
      default: [],
    },
    aiTone: {
      type: String,
      enum: ['professional', 'casual', 'friendly', 'expert'] as AITone[],
      default: 'professional',
    },
    valueProposition: {
      type: String,
      required: true,
    },
    signature: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

personaSchema.index({ userId: 1, isActive: 1 });

personaSchema.statics.findByUserId = function (
  userId: string,
  options?: { activeOnly?: boolean }
): Promise<IPersonaDocument[]> {
  const query: Record<string, unknown> = { userId };

  if (options?.activeOnly) {
    query.isActive = true;
  }

  return this.find(query).sort({ createdAt: -1 }).exec();
};

personaSchema.statics.findActivePersona = function (
  userId: string
): Promise<IPersonaDocument | null> {
  return this.findOne({ userId, isActive: true }).exec();
};

export interface IPersonaModel extends Model<IPersonaDocument> {
  findByUserId(
    userId: string,
    options?: { activeOnly?: boolean }
  ): Promise<IPersonaDocument[]>;
  findActivePersona(userId: string): Promise<IPersonaDocument | null>;
}

export const Persona = mongoose.model<IPersonaDocument, IPersonaModel>(
  'Persona',
  personaSchema
);
