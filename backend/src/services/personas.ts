import { Persona } from '../models/Persona.js';
import type { AITone } from '../types/index.js';

export async function listPersonas(userId: string, activeOnly?: boolean) {
  return Persona.findByUserId(userId, { activeOnly });
}

export async function createPersona(userId: string, data: {
  name: string;
  role: string;
  keywords?: string[];
  negativeKeywords?: string[];
  aiTone?: AITone;
  valueProposition: string;
  signature?: string;
  isActive?: boolean;
}) {
  return Persona.create({ ...data, userId });
}

export async function getPersonaById(userId: string, personaId: string) {
  const persona = await Persona.findById(personaId);
  if (!persona || persona.userId !== userId) return null;
  return persona;
}

export async function updatePersona(userId: string, personaId: string, updates: Partial<{
  name: string;
  role: string;
  keywords: string[];
  negativeKeywords: string[];
  aiTone: AITone;
  valueProposition: string;
  signature: string;
  isActive: boolean;
}>) {
  const existing = await Persona.findById(personaId);
  if (!existing || existing.userId !== userId) return null;
  return Persona.update(personaId, updates);
}

export async function activatePersona(userId: string, personaId: string) {
  return Persona.activate(personaId, userId);
}

export async function deletePersona(userId: string, personaId: string) {
  const existing = await Persona.findById(personaId);
  if (!existing || existing.userId !== userId) return false;
  return Persona.delete(personaId);
}

export async function getActivePersona(userId: string) {
  return Persona.findActivePersona(userId);
}
