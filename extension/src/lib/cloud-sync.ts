import type { Lead, Persona } from '../types';
import { createLeadsBulk } from '../api/leads';
import { createPersona } from '../api/personas';
import { toApiLeadInput, toApiPersonaInput } from '../api/mappers';

export async function syncLeadsToCloud(leads: Lead[]): Promise<void> {
  if (leads.length === 0) return;
  const apiLeads = leads.map(toApiLeadInput);
  await createLeadsBulk(apiLeads);
}

export async function syncPersonasToCloud(personas: Persona[]): Promise<void> {
  if (personas.length === 0) return;
  for (const persona of personas) {
    await createPersona(toApiPersonaInput(persona));
  }
}

export async function syncAllToCloud(params: {
  leads: Lead[];
  personas: Persona[];
}): Promise<void> {
  await syncLeadsToCloud(params.leads);
  await syncPersonasToCloud(params.personas);
}
