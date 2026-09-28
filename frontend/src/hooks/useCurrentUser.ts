import { useQuery } from './core/useQuery';
import { userService } from '@/api/services/user.service';
import type { UserProfile } from '@/api/services/user.service';
import type { UseQueryResult } from './core/types';

export function useCurrentUser(options?: { enabled?: boolean }): UseQueryResult<UserProfile, void> {
  return useQuery<UserProfile, void>(
    () => userService.getMyProfile(),
    undefined,
    {
      enabled: options?.enabled ?? true,
    }
  );
}
