import mongoose, { Schema, Document, Model } from 'mongoose';
import type { IAutomationSettings } from '../types/index.js';

export interface IAutomationSettingsDocument extends IAutomationSettings, Document {}

const automationSettingsSchema = new Schema<IAutomationSettingsDocument>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    enabled: {
      type: Boolean,
      default: false,
    },
    scanIntervalMinutes: {
      type: Number,
      default: 30,
      min: 5,
      max: 1440,
    },
    groupsPerCycle: {
      type: Number,
      default: 3,
      min: 1,
      max: 20,
    },
    delayMinSeconds: {
      type: Number,
      default: 5,
      min: 1,
    },
    delayMaxSeconds: {
      type: Number,
      default: 15,
      min: 5,
    },
    lastScanAt: Date,
  },
  {
    timestamps: true,
  }
);

automationSettingsSchema.statics.findByUserId = function (
  userId: string
): Promise<IAutomationSettingsDocument | null> {
  return this.findOne({ userId }).exec();
};

automationSettingsSchema.statics.findOrCreate = async function (
  userId: string
): Promise<IAutomationSettingsDocument> {
  let settings = await this.findOne({ userId });

  if (!settings) {
    settings = await this.create({ userId });
  }

  return settings;
};

automationSettingsSchema.statics.updateLastScan = async function (
  userId: string
): Promise<void> {
  await this.findOneAndUpdate(
    { userId },
    { $set: { lastScanAt: new Date() } }
  );
};

export interface IAutomationSettingsModel extends Model<IAutomationSettingsDocument> {
  findByUserId(userId: string): Promise<IAutomationSettingsDocument | null>;
  findOrCreate(userId: string): Promise<IAutomationSettingsDocument>;
  updateLastScan(userId: string): Promise<void>;
}

export const AutomationSettings = mongoose.model<
  IAutomationSettingsDocument,
  IAutomationSettingsModel
>('AutomationSettings', automationSettingsSchema);
