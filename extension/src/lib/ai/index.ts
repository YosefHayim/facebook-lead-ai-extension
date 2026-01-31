import { classifyIntent as classifyGemini, generateReply as generateGemini, initGemini } from './gemini';
import { classifyIntentOpenAI, generateReplyOpenAI, initOpenAI } from './openai';
import type { AIAnalysis, Persona } from '../../types';
import { settingsStorage, incrementUsage } from '../storage';
import { logger } from '../../utils/logger';

export type AIProvider = 'gemini' | 'openai';

export function initAI(provider: AIProvider, apiKey: string): void {
  logger.ai.info(`Initializing AI provider: ${provider}`, { provider, hasKey: !!apiKey });
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
  const startTime = Date.now();
  
  logger.ai.info('Classifying post intent', { 
    provider: settings.aiProvider, 
    textLength: postText.length,
    personaId: persona.id 
  });
  
  await incrementUsage('aiCall');
  
  try {
    let result: AIAnalysis;
    if (settings.aiProvider === 'openai') {
      result = await classifyIntentOpenAI(postText, persona);
    } else {
      result = await classifyGemini(postText, persona);
    }
    
    logger.logAiAnalysis('classifyIntent', 
      { textLength: postText.length }, 
      result, 
      Date.now() - startTime
    );
    
    return result;
  } catch (error) {
    logger.ai.error('Failed to classify post intent', { error, provider: settings.aiProvider });
    throw error;
  }
}

export async function generatePostReply(
  postText: string,
  analysis: AIAnalysis,
  persona: Persona
): Promise<string> {
  const settings = await settingsStorage.getValue();
  const startTime = Date.now();
  
  logger.ai.info('Generating reply', { 
    provider: settings.aiProvider, 
    intent: analysis.intent,
    leadScore: analysis.leadScore 
  });
  
  await incrementUsage('aiCall');
  
  try {
    let reply: string;
    
    if (settings.aiProvider === 'openai') {
      reply = await generateReplyOpenAI(postText, analysis.intent, persona);
    } else {
      reply = await generateGemini(postText, analysis.intent, persona);
    }
    
    if (settings.transparencyEnabled && settings.transparencyText) {
      reply = `${reply}\n\n${settings.transparencyText}`;
    }
    
    logger.ai.info('Reply generated', { 
      replyLength: reply.length, 
      durationMs: Date.now() - startTime 
    });
    
    return reply;
  } catch (error) {
    logger.ai.error('Failed to generate reply', { error, provider: settings.aiProvider });
    throw error;
  }
}
