import { httpClient } from '../core/client';
import { tokenStorage } from '../core/token-storage';
import { environment } from '@/config/environment';
import type { IHttpClient } from '../interfaces/http.interface';
import type { ITokenStorage } from '../interfaces/token.interface';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUserData {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  message?: string;
  accessToken: string;
  refreshToken: string;
  user: AuthUserData;
}

export interface RefreshResponse {
  message?: string;
  accessToken: string;
}

export interface LogoutResponse {
  message?: string;
}

export class AuthService {
  private readonly http: IHttpClient;
  private readonly storage: ITokenStorage;

  constructor(http: IHttpClient = httpClient, storage: ITokenStorage = tokenStorage) {
    this.http = http;
    this.storage = storage;
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await this.http.post<AuthResponse>('/auth/login', payload, {
      skipAuth: true,
    });

    if (response?.accessToken) {
      this.storage.setAccessToken(response.accessToken);
    }
    if (response?.refreshToken) {
      this.storage.setRefreshToken(response.refreshToken);
    }
    if (response?.user) {
      try {
        localStorage.setItem(environment.auth.userKey, JSON.stringify(response.user));
      } catch {
        // Ignore storage error
      }
    }

    return response;
  }

  async refresh(refreshToken?: string): Promise<RefreshResponse> {
    const token = refreshToken || this.storage.getRefreshToken();
    if (!token) {
      throw new Error('No refresh token available');
    }

    const response = await this.http.post<RefreshResponse>(
      '/auth/refresh',
      { refreshToken: token },
      { skipAuth: true }
    );

    if (response?.accessToken) {
      this.storage.setAccessToken(response.accessToken);
    }

    return response;
  }

  async logout(): Promise<LogoutResponse> {
    const refreshToken = this.storage.getRefreshToken();
    try {
      const response = await this.http.post<LogoutResponse>('/auth/logout', {
        refreshToken: refreshToken || '',
      });
      return response;
    } finally {
      this.clearSession();
    }
  }

  clearSession(): void {
    this.storage.clearTokens();
    try {
      localStorage.removeItem(environment.auth.userKey);
    } catch {
      // Ignore
    }
  }

  isAuthenticated(): boolean {
    return this.storage.hasValidAccessToken();
  }

  getSavedUser(): AuthUserData | null {
    try {
      const raw = localStorage.getItem(environment.auth.userKey);
      return raw ? (JSON.parse(raw) as AuthUserData) : null;
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();
