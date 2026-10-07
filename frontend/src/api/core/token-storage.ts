import { environment } from '@/config/environment';
import type { ITokenStorage } from '../interfaces/token.interface';

export class LocalStorageTokenStorage implements ITokenStorage {
  private readonly accessKey: string;
  private readonly refreshKey: string;

  constructor(
    accessKey: string = environment.auth.accessTokenKey,
    refreshKey: string = environment.auth.refreshTokenKey
  ) {
    this.accessKey = accessKey;
    this.refreshKey = refreshKey;
  }

  getAccessToken(): string | null {
    try {
      return localStorage.getItem(this.accessKey);
    } catch {
      return null;
    }
  }

  setAccessToken(token: string): void {
    try {
      localStorage.setItem(this.accessKey, token);
    } catch {
      // Ignore storage errors in restricted environments
    }
  }

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(this.refreshKey);
    } catch {
      return null;
    }
  }

  setRefreshToken(token: string): void {
    try {
      localStorage.setItem(this.refreshKey, token);
    } catch {
      // Ignore storage errors in restricted environments
    }
  }

  clearTokens(): void {
    try {
      localStorage.removeItem(this.accessKey);
      localStorage.removeItem(this.refreshKey);
    } catch {
      // Ignore storage errors
    }
  }

  hasValidAccessToken(): boolean {
    const token = this.getAccessToken();
    return Boolean(token && token.trim().length > 0);
  }
}

export class MemoryTokenStorage implements ITokenStorage {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  setRefreshToken(token: string): void {
    this.refreshToken = token;
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
  }

  hasValidAccessToken(): boolean {
    return Boolean(this.accessToken && this.accessToken.trim().length > 0);
  }
}

// Default singleton instance for application use
export const tokenStorage: ITokenStorage = new LocalStorageTokenStorage();
