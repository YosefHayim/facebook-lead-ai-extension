import type { Lead, Persona } from '../types';
import type { CreateLeadInput, CreatePersonaInput } from './types';

export function toApiLeadInput(lead: Lead): CreateLeadInput {
  return {
    postUrl: lead.postUrl,
    postText: lead.postText,
    authorName: lead.authorName,
    authorProfileUrl: lead.authorProfileUrl,
    groupName: lead.groupName,
    intent: lead.intent,
    leadScore: lead.leadScore,
    aiAnalysis: lead.aiAnalysis
      ? {
          intent: lead.aiAnalysis.intent,
          confidence: lead.aiAnalysis.confidence,
          reasoning: lead.aiAnalysis.reasoning,
          keywords: lead.aiAnalysis.keywords,
        }
      : undefined,
    aiDraftReply: lead.aiDraftReply,
  };
}

export function toApiPersonaInput(persona: Persona): CreatePersonaInput {
  return {
    name: persona.name,
    role: persona.role,
    keywords: persona.keywords,
    negativeKeywords: persona.negativeKeywords,
    aiTone: persona.aiTone,
    valueProposition: persona.valueProposition,
    signature: persona.signature,
    isActive: persona.isActive,
  };
}
