/**
 * Environment configuration module for EnglishHub Frontend.
 * Centralizes all environment variables and API endpoint paths,
 * eliminating hardcoded URLs across services and interceptors.
 */

export interface EnvConfig {
  /** API Base URL (e.g. 'http://localhost:8080/api/v1' or '/api/v1') */
  API_BASE_URL: string;
  /** Global API request timeout in milliseconds */
  API_TIMEOUT: number;
  /** Silent token refresh request timeout in milliseconds */
  AUTH_REFRESH_TIMEOUT: number;
  /** Current application environment */
  APP_ENV: 'development' | 'staging' | 'production' | 'test';
  /** Default fallback language */
  DEFAULT_LANGUAGE: string;
  /** Endpoints routing map */
  ENDPOINTS: {
    AUTH: {
      BASE: string;
      LOGIN: string;
      REFRESH: string;
      LOGOUT: string;
      REGISTER: string;
    };
    USERS: {
      BASE: string;
      ME: string;
      PROFILE: string;
      CHANGE_PASSWORD: string;
    };
    CLASSES: {
      BASE: string;
    };
    ASSIGNMENTS: {
      BASE: string;
    };
  };
}

/**
 * Safely accesses Vite import.meta.env even in non-browser or test runner environments.
 */
function getRawEnv(): Record<string, string | undefined> {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env as unknown as Record<string, string | undefined>;
  }
  const globalScope = globalThis as unknown as { process?: { env?: Record<string, string | undefined> } };
  if (globalScope.process?.env) {
    return globalScope.process.env;
  }
  return {};
}

/**
 * Parses and returns the typed environment configuration with robust defaults.
 */
export function loadEnvConfig(): EnvConfig {
  const env = getRawEnv();

  // Resolve base URL: priority VITE_API_BASE_URL > VITE_BACKEND_BASE_URL > fallback '/api/v1'
  const rawBaseUrl =
    env.VITE_API_BASE_URL ||
    env.VITE_BACKEND_BASE_URL ||
    '/api/v1';

  const cleanBaseUrl = rawBaseUrl.replace(/\/+$/, '');

  const apiTimeout = Number(env.VITE_API_TIMEOUT) || 20000;
  const refreshTimeout = Number(env.VITE_AUTH_REFRESH_TIMEOUT) || 10000;

  const appEnv = (env.VITE_APP_ENV || 'development') as EnvConfig['APP_ENV'];
  const defaultLang = env.VITE_DEFAULT_LANGUAGE || 'vi';

  // Auth endpoints
  const authBase = env.VITE_ENDPOINT_AUTH_BASE || '/auth';
  const authLogin = env.VITE_ENDPOINT_AUTH_LOGIN || `${authBase}/login`;
  const authRefresh = env.VITE_ENDPOINT_AUTH_REFRESH || `${authBase}/refresh`;
  const authLogout = env.VITE_ENDPOINT_AUTH_LOGOUT || `${authBase}/logout`;
  const authRegister = env.VITE_ENDPOINT_AUTH_REGISTER || `${authBase}/register`;

  // Users endpoints
  const usersBase = env.VITE_ENDPOINT_USERS_BASE || '/users';
  const usersMe = env.VITE_ENDPOINT_USERS_ME || `${usersBase}/me`;
  const usersProfile = env.VITE_ENDPOINT_USERS_PROFILE || `${usersMe}/profile`;
  const usersPassword = env.VITE_ENDPOINT_USERS_PASSWORD || `${usersMe}/change-password`;

  // Classes & Assignments endpoints
  const classesBase = env.VITE_ENDPOINT_CLASSES_BASE || '/classes';
  const assignmentsBase = env.VITE_ENDPOINT_ASSIGNMENTS_BASE || '/assignments';

  return {
    API_BASE_URL: cleanBaseUrl,
    API_TIMEOUT: apiTimeout,
    AUTH_REFRESH_TIMEOUT: refreshTimeout,
    APP_ENV: appEnv,
    DEFAULT_LANGUAGE: defaultLang,
    ENDPOINTS: {
      AUTH: {
        BASE: authBase,
        LOGIN: authLogin,
        REFRESH: authRefresh,
        LOGOUT: authLogout,
        REGISTER: authRegister,
      },
      USERS: {
        BASE: usersBase,
        ME: usersMe,
        PROFILE: usersProfile,
        CHANGE_PASSWORD: usersPassword,
      },
      CLASSES: {
        BASE: classesBase,
      },
      ASSIGNMENTS: {
        BASE: assignmentsBase,
      },
    },
  };
}

/**
 * Singleton instance of parsed environment configuration.
 */
export const envConfig: EnvConfig = loadEnvConfig();
