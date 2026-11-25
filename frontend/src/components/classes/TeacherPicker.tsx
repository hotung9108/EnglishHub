import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Search, X, ChevronDown, Check, Loader2 } from 'lucide-react';
import { userService, type UserListItem } from '../../api/services/user.service';

export interface TeacherPickerProps {
  teachers?: UserListItem[];
  initialTeachers?: UserListItem[];
  selectedTeacherId?: string | number | null;
  onSelectTeacher: (teacher: UserListItem | null) => void;
  loading?: boolean;
  isVi?: boolean;
  disabled?: boolean;
  pageSize?: number;
  placeholder?: string;
  className?: string;
}

export const TeacherPicker: React.FC<TeacherPickerProps> = ({
  teachers: externalTeachers,
  initialTeachers,
  selectedTeacherId,
  onSelectTeacher,
  loading: externalLoading = false,
  isVi = true,
  disabled = false,
  pageSize = 20,
  placeholder,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [internalTeachers, setInternalTeachers] = useState<UserListItem[]>(initialTeachers || []);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState(false);
  const [resolvedTeacher, setResolvedTeacher] = useState<UserListItem | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSelfManaged = !externalTeachers;

  // Active list of teachers
  const activeTeachers = useMemo(() => {
    if (externalTeachers && !searchQuery.trim()) {
      return externalTeachers;
    }
    return internalTeachers;
  }, [externalTeachers, searchQuery, internalTeachers]);

  // Find currently selected teacher
  const selectedTeacher = useMemo(() => {
    if (!selectedTeacherId) return null;
    const sId = String(selectedTeacherId);
    if (resolvedTeacher && String(resolvedTeacher.id) === sId) {
      return resolvedTeacher;
    }
    const foundInActive = activeTeachers.find(t => String(t.id) === sId);
    if (foundInActive) return foundInActive;
    if (externalTeachers) {
      const foundInExternal = externalTeachers.find(t => String(t.id) === sId);
      if (foundInExternal) return foundInExternal;
    }
    return resolvedTeacher;
  }, [selectedTeacherId, resolvedTeacher, activeTeachers, externalTeachers]);

  // Resolve selected teacher details if not in current list
  useEffect(() => {
    if (!selectedTeacherId) {
      return;
    }
    const sId = String(selectedTeacherId);
    const existing = (externalTeachers || []).find(t => String(t.id) === sId) ||
                     internalTeachers.find(t => String(t.id) === sId);
    if (existing) {
      return;
    }

    let isMounted = true;
    userService.getUserById(Number(selectedTeacherId))
      .then(user => {
        if (isMounted && user) {
          setResolvedTeacher(user);
        }
      })
      .catch(() => {
        // Fallback gracefully
      });

    return () => {
      isMounted = false;
    };
  }, [selectedTeacherId, externalTeachers, internalTeachers]);

  // Fetch teachers from backend (for self-managed mode or server search)
  const fetchTeachers = useCallback(async (query: string, page: number, append = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsSearching(true);
      }

      const res = await userService.listUsers({
        role: 'TEACHER',
        q: query.trim() || undefined,
        page,
        limit: pageSize,
      });

      const newItems = res.data || [];
      const total = res.pagination?.total ?? newItems.length;
      const limit = res.pagination?.limit ?? pageSize;
      const curPage = res.pagination?.page ?? page;

      setTotalCount(total);
      setHasMore(curPage * limit < total);
      setCurrentPage(curPage);

      setInternalTeachers(prev => {
        if (!append) return newItems;
        const existingIds = new Set(prev.map(item => item.id));
        const filteredNew = newItems.filter(item => !existingIds.has(item.id));
        return [...prev, ...filteredNew];
      });
    } catch {
      if (!append) {
        setInternalTeachers([]);
        setTotalCount(0);
        setHasMore(false);
      }
    } finally {
      setIsSearching(false);
      setIsLoadingMore(false);
    }
  }, [pageSize]);

  const handleToggleOpen = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && isSelfManaged && internalTeachers.length === 0 && !isSearching) {
      fetchTeachers(searchQuery, 1, false);
    }
  };

  // Handle Search Input with debounce
  useEffect(() => {
    if (!isOpen) return;

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      // If externalTeachers is provided and query is empty, clear internal and show external
      if (externalTeachers && !searchQuery.trim()) {
        setInternalTeachers([]);
        setTotalCount(externalTeachers.length);
        setHasMore(false);
        return;
      }

      // If externalTeachers provided and local search is preferred or fallback to server search
      fetchTeachers(searchQuery, 1, false);
    }, 300);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery, isOpen, externalTeachers, fetchTeachers]);

  // Handle load more
  const handleLoadMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasMore || isLoadingMore) return;
    fetchTeachers(searchQuery, currentPage + 1, true);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || 'GV';
  };

  if (externalLoading) {
    return (
      <div className={`flex items-center gap-2 py-3 px-4 border border-outline-variant rounded-xl bg-surface ${className}`}>
        <Loader2 size={18} className="animate-spin text-primary" />
        <span className="text-sm text-on-surface-variant">
          {isVi ? 'Đang tải danh sách giảng viên...' : 'Loading teachers...'}
        </span>
      </div>
    );
  }

  return (
    <div className={`tp-wrapper ${className}`} ref={wrapperRef}>
      {/* Selected Teacher Display Card */}
      {selectedTeacher ? (
        <div className="tp-selected-card">
          <div className="tp-selected-info">
            <div className="tp-avatar">
              {getInitials(selectedTeacher.fullName)}
            </div>
            <div className="min-w-0">
              <div className="tp-name-row">
                <span className="tp-name truncate">{selectedTeacher.fullName}</span>
                <span className="tp-code-badge flex-shrink-0">
                  GV-{String(selectedTeacher.id).padStart(3, '0')}
                </span>
              </div>
              <div className="tp-email truncate">{selectedTeacher.email}</div>
            </div>
          </div>
          <div className="tp-action-group">
            <button
              type="button"
              disabled={disabled}
              className="tp-change-btn"
              onClick={handleToggleOpen}
            >
              {isVi ? 'Đổi giáo viên' : 'Change'}
            </button>
            <button
              type="button"
              disabled={disabled}
              className="tp-clear-btn"
              onClick={() => {
                onSelectTeacher(null);
                setResolvedTeacher(null);
                setSearchQuery('');
              }}
              title={isVi ? 'Bỏ chọn giáo viên' : 'Clear selection'}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        /* Trigger button when no teacher is selected */
        <button
          type="button"
          disabled={disabled}
          className="tp-trigger-btn"
          onClick={handleToggleOpen}
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search size={16} className="flex-shrink-0 text-secondary" />
            <span className="truncate">
              {placeholder || (isVi ? '-- Tìm và chọn Giảng viên phụ trách --' : '-- Search & Select Instructor --')}
            </span>
          </div>
          <ChevronDown size={16} className={`text-secondary transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* Dropdown Menu with Live Search and Pagination */}
      {isOpen && !disabled && (
        <div className="tp-dropdown">
          <div className="tp-search-box">
            <div className="relative">
              <Search size={15} className="tp-search-icon" />
              <input
                type="text"
                className="tp-search-input"
                placeholder={isVi ? 'Tìm theo tên, email hoặc mã GV...' : 'Search by name, email or code...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {isSearching ? (
                <Loader2 size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-primary animate-spin" />
              ) : searchQuery ? (
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-primary cursor-pointer border-none bg-transparent"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>
          </div>

          <div className="tp-item-list">
            {isSearching && activeTeachers.length === 0 ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-sm text-secondary">
                <Loader2 size={20} className="animate-spin text-primary" />
                <span>{isVi ? 'Đang tìm kiếm giảng viên...' : 'Searching instructors...'}</span>
              </div>
            ) : activeTeachers.length === 0 ? (
              <div className="py-6 text-center text-sm text-secondary">
                {isVi ? 'Không tìm thấy giảng viên nào phù hợp' : 'No instructors found'}
              </div>
            ) : (
              activeTeachers.map(tc => {
                const isSelected = String(tc.id) === String(selectedTeacherId);
                return (
                  <div
                    key={tc.id}
                    className={`tp-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      onSelectTeacher(tc);
                      setResolvedTeacher(tc);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="tp-item-avatar">
                        {getInitials(tc.fullName)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold truncate text-primary-dark">{tc.fullName}</span>
                          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-surface-dim text-secondary flex-shrink-0">
                            GV-{String(tc.id).padStart(3, '0')}
                          </span>
                        </div>
                        <div className="text-xs text-secondary truncate">{tc.email}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-primary flex-shrink-0 ml-2">
                        <Check size={16} />
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination / Load More Footer */}
          {hasMore && (
            <div className="tp-item-footer">
              <button
                type="button"
                disabled={isLoadingMore}
                onClick={handleLoadMore}
                className="text-xs font-semibold text-primary hover:underline flex items-center justify-center gap-1.5 w-full py-1 border-none bg-transparent cursor-pointer disabled:opacity-50"
              >
                {isLoadingMore && <Loader2 size={13} className="animate-spin" />}
                <span>
                  {isLoadingMore
                    ? (isVi ? 'Đang tải thêm...' : 'Loading more...')
                    : (isVi ? 'Tải thêm giảng viên...' : 'Load more instructors...')}
                </span>
              </button>
            </div>
          )}

          {/* Total Count Info */}
          {totalCount > 0 && (
            <div className="tp-item-footer">
              {isVi
                ? `Hiển thị ${activeTeachers.length}/${totalCount} giảng viên`
                : `Showing ${activeTeachers.length}/${totalCount} instructors`}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
