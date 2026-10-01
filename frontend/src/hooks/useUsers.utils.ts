import type { UserListParams, UserPagination } from '@/api/services/user.service';

export function clampPage(page = 1): number {
  return Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
}

export function clampLimit(limit = 20): number {
  return Number.isFinite(limit) ? Math.min(100, Math.max(1, Math.floor(limit))) : 20;
}

export function buildListParams(params: UserListParams = {}, extra: Record<string, string> = {}) {
  const q = params.q?.trim();
  return {
    page: clampPage(params.page),
    limit: clampLimit(params.limit),
    ...(q ? { q } : {}),
    ...(params.role ? { role: params.role } : {}),
    ...extra,
  };
}

export function computePagination({ page, limit, total }: UserPagination) {
  const currentPage = clampPage(page);
  const pageLimit = clampLimit(limit);
  const totalPages = Math.ceil(Math.max(0, total) / pageLimit);
  return {
    page: currentPage,
    limit: pageLimit,
    total,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrevious: currentPage > 1,
  };
}

export function pageAfterEmptyRefetch(page: number, itemCount: number): number {
  const currentPage = clampPage(page);
  return itemCount === 0 && currentPage > 1 ? currentPage - 1 : currentPage;
}
