import { classifyIntent as classifyGemini, generateReply as generateGemini, initGemini } from './gemini';
import { classifyIntentOpenAI, generateReplyOpenAI, initOpenAI } from './openai';
import type { AIAnalysis, Persona } from '../../types';
import { settingsStorage, incrementUsage } from '../storage';

export type AIProvider = 'gemini' | 'openai';

export function initAI(provider: AIProvider, apiKey: string): void {
  if (provider === 'gemini') {
    initGemini(apiKey);
  } else {
    initOpenAI(apiKey);
  }
}

export async function classifyPostIntent(
  postText: string,
  persona: Persona
): Promise<AIAnalysis> {
  const settings = await settingsStorage.getValue();
  await incrementUsage('aiCall');
  
  if (settings.aiProvider === 'openai') {
    return classifyIntentOpenAI(postText, persona);
  }
  
  return classifyGemini(postText, persona);
}

export async function generatePostReply(
  postText: string,
  analysis: AIAnalysis,
  persona: Persona
): Promise<string> {
  const settings = await settingsStorage.getValue();
  await incrementUsage('aiCall');
  
  let reply: string;
  
  if (settings.aiProvider === 'openai') {
    reply = await generateReplyOpenAI(postText, analysis.intent, persona);
  } else {
    reply = await generateGemini(postText, analysis.intent, persona);
  }
  
  if (settings.transparencyEnabled && settings.transparencyText) {
    reply = `${reply}\n\n${settings.transparencyText}`;
  }
  
  return reply;
}
