import axios from 'axios';
import type { AxiosInstance, CreateAxiosDefaults } from 'axios';
import { setupInterceptors } from './interceptors';

export interface CreateClientConfig extends CreateAxiosDefaults {
  enableInterceptors?: boolean;
}

/**
 * Resolves the default API base URL using Vite environment variables.
 * Falls back to '/api/v1' for reverse proxy / dev setups.
 */
export function getDefaultBaseUrl(): string {
  const env = typeof import.meta !== 'undefined' ? import.meta.env : undefined;
  const envUrl =
    env?.VITE_API_BASE_URL ||
    env?.VITE_BACKEND_BASE_URL ||
    '/api/v1';

  // Ensure trailing slashes are cleanly handled if needed, or return trimmed
  return envUrl.replace(/\/+$/, '');
}

/**
 * Factory function to create configured Axios instances.
 * Adheres to Open/Closed Principle and Dependency Inversion Principle.
 */
export function createApiClient(customConfig: CreateClientConfig = {}): AxiosInstance {
  const { enableInterceptors = true, ...axiosConfig } = customConfig;

  const instance = axios.create({
    baseURL: getDefaultBaseUrl(),
    timeout: 20000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...axiosConfig.headers,
    },
    ...axiosConfig,
  });

  if (enableInterceptors) {
    setupInterceptors(instance);
  }

  return instance;
}

/**
 * Default shared Axios instance for EnglishHub frontend application.
 */
export const axiosClient = createApiClient();
