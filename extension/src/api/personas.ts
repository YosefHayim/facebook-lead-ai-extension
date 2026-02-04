import { apiRequest } from './client';
import type { ApiResponse } from './client';
import type { ApiPersona, CreatePersonaInput } from './types';

export type { ApiPersona, CreatePersonaInput };

export async function getPersonas(
  activeOnly?: boolean
): Promise<ApiResponse<{ personas: ApiPersona[] }>> {
  const query = activeOnly ? '?activeOnly=true' : '';
  return apiRequest(`/personas${query}`);
}

export async function getActivePersona(): Promise<ApiResponse<{ persona: ApiPersona | null }>> {
  return apiRequest('/personas/active');
}

export async function createPersona(
  persona: CreatePersonaInput
): Promise<ApiResponse<{ persona: ApiPersona }>> {
  return apiRequest('/personas', {
    method: 'POST',
    body: JSON.stringify(persona),
  });
}

export async function updatePersona(
  personaId: string,
  updates: Partial<ApiPersona>
): Promise<ApiResponse<{ persona: ApiPersona }>> {
  return apiRequest(`/personas/${personaId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function activatePersona(
  personaId: string
): Promise<ApiResponse<{ persona: ApiPersona }>> {
  return apiRequest(`/personas/${personaId}/activate`, {
    method: 'POST',
  });
}

export async function deletePersona(personaId: string): Promise<ApiResponse<{ message: string }>> {
  return apiRequest(`/personas/${personaId}`, {
    method: 'DELETE',
  });
}
