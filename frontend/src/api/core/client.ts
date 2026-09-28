import axios from 'axios';
import type { AxiosInstance, CreateAxiosDefaults } from 'axios';
import { setupInterceptors } from './interceptors';

import { envConfig } from '../../config/env';

export interface CreateClientConfig extends CreateAxiosDefaults {
  enableInterceptors?: boolean;
}

/**
 * Resolves the default API base URL using centralized envConfig.
 */
export function getDefaultBaseUrl(): string {
  return envConfig.API_BASE_URL;
}

/**
 * Factory function to create configured Axios instances.
 * Adheres to Open/Closed Principle and Dependency Inversion Principle.
 */
export function createApiClient(customConfig: CreateClientConfig = {}): AxiosInstance {
  const { enableInterceptors = true, ...axiosConfig } = customConfig;

  const instance = axios.create({
    baseURL: getDefaultBaseUrl(),
    timeout: envConfig.API_TIMEOUT,
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
