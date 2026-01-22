import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIAnalysis, IntentType, Persona } from '../../types';
import { logger } from '../../utils/logger';

let genAI: GoogleGenerativeAI | null = null;

export function initGemini(apiKey: string): void {
  logger.api.info('Gemini SDK initialized');
  genAI = new GoogleGenerativeAI(apiKey);
}

const INTENT_CLASSIFICATION_PROMPT = `You are an AI that classifies social media posts for B2B lead generation.

Analyze the post and determine:
1. Intent: What is the poster looking for?
2. Lead Score: How likely is this person to convert? (0-100)
3. Confidence: How confident are you in this classification? (0-1)
4. Keywords: Key phrases that indicate the intent

Intent Categories:
- seeking_service: Actively looking for a service, product, or solution
- hiring: Job posting or looking for employees/contractors
- complaining: Negative experience with a competitor (opportunity to offer alternative)
- recommendation: Asking for suggestions or recommendations
- discussion: General discussion, not actionable
- selling: Promoting their own product/service (competitor)
- irrelevant: Off-topic, spam, or not a potential lead

Scoring Guidelines:
- 80-100: Clear intent to purchase/hire, urgent need expressed
- 60-79: Strong interest, asking for recommendations
- 40-59: Moderate interest, exploring options
- 20-39: Low interest, just discussing
- 0-19: No commercial intent

Respond ONLY with valid JSON in this exact format:
{"intent":"seeking_service","confidence":0.85,"reasoning":"Brief explanation","leadScore":75,"keywords":["looking for","need help"]}`;

export async function classifyIntent(
  postText: string,
  persona: Persona
): Promise<AIAnalysis> {
  if (!genAI) {
    logger.api.error('Gemini not initialized');
    throw new Error('Gemini not initialized. Call initGemini() first.');
  }
  
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const startTime = Date.now();
  
  const prompt = `${INTENT_CLASSIFICATION_PROMPT}

Context - Keywords to prioritize: ${persona.keywords.join(', ')}
Context - Keywords to deprioritize: ${persona.negativeKeywords.join(', ')}

Post to classify:
"${postText.slice(0, 1500)}"`;
  
  logger.logApiRequest('gemini', 'generateContent/classifyIntent', { 
    model: 'gemini-1.5-flash',
    promptLength: prompt.length 
  });
  
  const result = await model.generateContent(prompt);
  const response = result.response.text();
  
  logger.logApiResponse('gemini', 'generateContent/classifyIntent', { 
    responseLength: response.length 
  }, Date.now() - startTime);
  
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    logger.api.error('Invalid AI response format - no JSON found', { response: response.slice(0, 200) });
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

const REPLY_GENERATION_PROMPT = `You are a helpful assistant that generates authentic, non-salesy replies for social media posts.

Guidelines:
1. Be genuinely helpful, not promotional
2. Acknowledge their specific situation
3. Offer value without being pushy
4. Sound like a real person, not a bot
5. Keep it concise (2-4 sentences max)
6. Don't use emojis unless the original post does
7. Never use phrases like "I'd be happy to help" or "Feel free to reach out"

Respond ONLY with the reply text, nothing else.`;

export async function generateReply(
  postText: string,
  intent: IntentType,
  persona: Persona
): Promise<string> {
  if (!genAI) {
    logger.api.error('Gemini not initialized');
    throw new Error('Gemini not initialized. Call initGemini() first.');
  }
  
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const startTime = Date.now();
  
  const toneGuide = {
    professional: 'formal but approachable',
    casual: 'friendly and conversational',
    friendly: 'warm and personable',
    expert: 'knowledgeable but not condescending',
  };
  
  const prompt = `${REPLY_GENERATION_PROMPT}

Your persona:
- Role: ${persona.role}
- Tone: ${toneGuide[persona.aiTone]}
- Value proposition: ${persona.valueProposition}
${persona.signature ? `- Signature style: ${persona.signature}` : ''}

The post intent is: ${intent}

Original post:
"${postText.slice(0, 1000)}"

Generate a helpful reply:`;
  
  logger.logApiRequest('gemini', 'generateContent/generateReply', { 
    model: 'gemini-1.5-flash',
    intent,
    promptLength: prompt.length 
  });
  
  const result = await model.generateContent(prompt);
  const reply = result.response.text().trim();
  
  logger.logApiResponse('gemini', 'generateContent/generateReply', { 
    replyLength: reply.length 
  }, Date.now() - startTime);
  
  return reply;
}
