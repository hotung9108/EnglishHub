import type { EnvironmentConfig } from './types';

export const developmentConfig: EnvironmentConfig = {
  api: {
    baseUrl:
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL as string | undefined) ||
      'http://localhost:8080/api/v1',
    timeout: 15000,
  },
  app: {
    name: 'EnglishHub (Development)',
    version: '1.0.0-dev',
  },
  auth: {
    accessTokenKey: 'eh_access_token',
    refreshTokenKey: 'eh_refresh_token',
    userKey: 'eh_user',
  },
} as const;
