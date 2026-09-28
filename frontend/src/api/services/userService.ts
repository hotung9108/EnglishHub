import { BaseCrudService } from '../core/BaseService';
import type { User } from '../../types/auth';
import type { PaginationParams } from '../../types/api.types';

export interface UserQueryParams extends PaginationParams {
  role?: string;
  status?: string;
}

export interface ChangePasswordDto {
  oldPassword?: string;
  newPassword: string;
  confirmPassword?: string;
}

/**
 * UserService provides standard CRUD operations for users,
 * extending BaseCrudService to adhere to SOLID principles.
 */
export class UserService extends BaseCrudService<User, Partial<User>, Partial<User>, UserQueryParams> {
  constructor() {
    super('/users');
  }

  /**
   * Retrieves profile of currently authenticated user.
   */
  public async getMe(): Promise<User> {
    return this.http.get<User>(this.buildUrl('me'));
  }

  /**
   * Updates profile details of currently authenticated user.
   */
  public async updateProfile(profileData: Partial<User>): Promise<User> {
    return this.http.put<User, Partial<User>>(this.buildUrl('me/profile'), profileData);
  }

  /**
   * Changes current user's password.
   */
  public async changePassword(dto: ChangePasswordDto): Promise<{ message: string }> {
    return this.http.post<{ message: string }, ChangePasswordDto>(
      this.buildUrl('me/change-password'),
      dto
    );
  }
}

export const userService = new UserService();
