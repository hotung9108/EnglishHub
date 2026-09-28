import type { ITokenService } from '../../types/api.types';

const ACCESS_TOKEN_KEY = 'eh_access_token';
const REFRESH_TOKEN_KEY = 'eh_refresh_token';

type TokenRefreshSubscriber = (newToken: string) => void;
type AuthFailureSubscriber = () => void;

/**
 * TokenService manages the storage, retrieval, and lifecycle events of authentication tokens.
 * Adheres to Single Responsibility Principle (SRP).
 */
export class TokenService implements ITokenService {
  private static instance: TokenService | null = null;
  private refreshSubscribers: Set<TokenRefreshSubscriber> = new Set();
  private authFailureSubscribers: Set<AuthFailureSubscriber> = new Set();

  /**
   * Singleton pattern to guarantee a single source of truth for auth tokens.
   */
  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  public getAccessToken(): string | null {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  public getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  public setTokens(tokens: { accessToken: string; refreshToken?: string }): void {
    try {
      if (tokens.accessToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
      }
      if (tokens.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
      }
      this.notifyRefreshSubscribers(tokens.accessToken);
    } catch (error) {
      console.error('[TokenService] Failed to save tokens to localStorage:', error);
    }
  }

  public setAccessToken(token: string): void {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
      this.notifyRefreshSubscribers(token);
    } catch (error) {
      console.error('[TokenService] Failed to update access token:', error);
    }
  }

  public clearTokens(): void {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      this.notifyAuthFailureSubscribers();
    } catch (error) {
      console.error('[TokenService] Failed to clear tokens:', error);
    }
  }

  public hasAccessToken(): boolean {
    const token = this.getAccessToken();
    return !!token && token.trim().length > 0;
  }

  public subscribeTokenRefresh(callback: TokenRefreshSubscriber): () => void {
    this.refreshSubscribers.add(callback);
    return () => {
      this.refreshSubscribers.delete(callback);
    };
  }

  public subscribeAuthFailure(callback: AuthFailureSubscriber): () => void {
    this.authFailureSubscribers.add(callback);
    return () => {
      this.authFailureSubscribers.delete(callback);
    };
  }

  private notifyRefreshSubscribers(newToken: string): void {
    this.refreshSubscribers.forEach((cb) => {
      try {
        cb(newToken);
      } catch (err) {
        console.error('[TokenService] Error in token refresh subscriber:', err);
      }
    });
  }

  private notifyAuthFailureSubscribers(): void {
    this.authFailureSubscribers.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('[TokenService] Error in auth failure subscriber:', err);
      }
    });
  }
}

export const tokenService = TokenService.getInstance();
