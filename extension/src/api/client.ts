import { authService } from '../lib/auth';
import { trackError } from '../lib/analytics';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = authService.getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const existingHeaders = options.headers as Record<string, string> | undefined;
  if (existingHeaders) {
    Object.assign(headers, existingHeaders);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`,
      };
    }

    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Network error';
    trackError(error instanceof Error ? error : new Error(errorMessage), {
      endpoint,
      method: options.method || 'GET',
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}
