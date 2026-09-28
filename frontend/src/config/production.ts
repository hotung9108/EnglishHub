import type { EnvironmentConfig } from './types';

export const productionConfig: EnvironmentConfig = {
  api: {
    baseUrl:
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL as string | undefined) ||
      '/api/v1',
    timeout: 20000,
  },
  app: {
    name: 'EnglishHub',
    version: '1.0.0',
  },
  auth: {
    accessTokenKey: 'eh_access_token',
    refreshTokenKey: 'eh_refresh_token',
    userKey: 'eh_user',
  },
} as const;
