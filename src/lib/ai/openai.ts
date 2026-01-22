import OpenAI from 'openai';
import type { AIAnalysis, IntentType, Persona } from '../../types';

let openai: OpenAI | null = null;

export function initOpenAI(apiKey: string): void {
  openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
}

export async function classifyIntentOpenAI(
  postText: string,
  persona: Persona
): Promise<AIAnalysis> {
  if (!openai) {
    throw new Error('OpenAI not initialized. Call initOpenAI() first.');
  }
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You classify social media posts for B2B lead generation. Respond ONLY with JSON.
        
Intents: seeking_service, hiring, complaining, recommendation, discussion, selling, irrelevant

Keywords to prioritize: ${persona.keywords.join(', ')}
Keywords to deprioritize: ${persona.negativeKeywords.join(', ')}

Format: {"intent":"...","confidence":0.0-1.0,"reasoning":"...","leadScore":0-100,"keywords":[]}`
      },
      {
        role: 'user',
        content: `Classify: "${postText.slice(0, 1500)}"`
      }
    ],
    temperature: 0.3,
    max_tokens: 200,
  });
  
  const content = response.choices[0]?.message?.content || '';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    throw new Error('Invalid AI response format');
  }
  
  const parsed = JSON.parse(jsonMatch[0]);
  
  return {
    intent: parsed.intent as IntentType,
    confidence: parsed.confidence,
    reasoning: parsed.reasoning,
    leadScore: parsed.leadScore,
    keywords: parsed.keywords || [],
  };
}

export async function generateReplyOpenAI(
  postText: string,
  intent: IntentType,
  persona: Persona
): Promise<string> {
  if (!openai) {
    throw new Error('OpenAI not initialized. Call initOpenAI() first.');
  }
  
  const toneGuide = {
    professional: 'formal but approachable',
    casual: 'friendly and conversational',
    friendly: 'warm and personable',
    expert: 'knowledgeable but not condescending',
  };
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Generate authentic, non-salesy social media replies. Be helpful, not promotional. 2-4 sentences max. No emojis unless the original post uses them. Sound human.

Your persona:
- Role: ${persona.role}
- Tone: ${toneGuide[persona.aiTone]}
- Value: ${persona.valueProposition}`
      },
      {
        role: 'user',
        content: `Intent: ${intent}\n\nPost: "${postText.slice(0, 1000)}"\n\nGenerate reply:`
      }
    ],
    temperature: 0.7,
    max_tokens: 150,
  });
  
  return response.choices[0]?.message?.content?.trim() || '';
}
