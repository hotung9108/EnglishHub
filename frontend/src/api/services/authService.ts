import { BaseService } from '../core/BaseService';
import { tokenService } from '../core/tokenService';
import type { User, Role } from '../../types/auth';

export interface LoginDto {
  email: string;
  password: string;
}

export interface BackendAuthUser {
  id: number | string;
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export interface LoginResponse {
  message?: string;
  accessToken: string;
  refreshToken: string;
  user: BackendAuthUser;
}

export interface RefreshResponse {
  accessToken: string;
  tokenType?: string;
  expiresIn?: number;
}

export interface LogoutResponse {
  message: string;
}

/**
 * AuthService handles authentication, token refreshes, and current user profile.
 * Extends BaseService adhering to SOLID principles.
 */
export class AuthService extends BaseService {
  constructor() {
    super('/auth');
  }

  /**
   * Performs user login. Automatically persists access and refresh tokens upon success.
   */
  public async login(credentials: LoginDto): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const response = await this.http.post<LoginResponse>(
      this.buildUrl('login'),
      credentials,
      { skipAuth: true }
    );

    // Persist tokens
    tokenService.setTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });

    // Map backend user to frontend User format
    const user: User = {
      id: String(response.user.id),
      name: response.user.fullName,
      email: response.user.email,
      role: (response.user.role.toLowerCase()) as Role,
      avatar: response.user.avatarUrl,
    };

    return {
      user,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    };
  }

  /**
   * Refreshes access token using the stored refresh token.
   */
  public async refresh(): Promise<string> {
    const refreshToken = tokenService.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.http.post<RefreshResponse>(
      this.buildUrl('refresh'),
      { refreshToken },
      { skipAuth: true }
    );

    tokenService.setAccessToken(response.accessToken);
    return response.accessToken;
  }

  /**
   * Performs user logout and clears all stored tokens.
   */
  public async logout(): Promise<void> {
    const refreshToken = tokenService.getRefreshToken();
    try {
      if (refreshToken) {
        await this.http.post<LogoutResponse>(
          this.buildUrl('logout'),
          { refreshToken }
        );
      }
    } finally {
      tokenService.clearTokens();
    }
  }

  /**
   * Retrieves the current authenticated user's profile from `/users/me`.
   */
  public async getCurrentUser(): Promise<User> {
    const backendUser = await this.http.get<BackendAuthUser>('/users/me');
    return {
      id: String(backendUser.id),
      name: backendUser.fullName,
      email: backendUser.email,
      role: (backendUser.role.toLowerCase()) as Role,
      avatar: backendUser.avatarUrl,
    };
  }
}

export const authService = new AuthService();
