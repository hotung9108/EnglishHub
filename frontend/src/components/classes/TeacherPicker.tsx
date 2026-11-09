import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, ChevronDown, Check, Loader2 } from 'lucide-react';
import type { UserListItem } from '../../api/services/user.service';

interface TeacherPickerProps {
  teachers: UserListItem[];
  selectedTeacherId: string;
  onSelectTeacher: (teacher: UserListItem | null) => void;
  loading?: boolean;
  isVi?: boolean;
}

export const TeacherPicker: React.FC<TeacherPickerProps> = ({
  teachers,
  selectedTeacherId,
  onSelectTeacher,
  loading = false,
  isVi = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedTeacher = useMemo(() => {
    return teachers.find(t => String(t.id) === String(selectedTeacherId)) || null;
  }, [teachers, selectedTeacherId]);

  const filteredTeachers = useMemo(() => {
    if (!searchQuery.trim()) return teachers;
    const q = searchQuery.toLowerCase().trim();
    return teachers.filter(t => 
      t.fullName.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      String(t.id).includes(q) ||
      `gv-${t.id}`.includes(q)
    );
  }, [teachers, searchQuery]);

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

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 px-4 border border-outline-variant rounded-lg bg-surface">
        <Loader2 size={18} className="animate-spin text-primary" />
        <span className="text-sm text-on-surface-variant">
          {isVi ? 'Đang tải danh sách giảng viên...' : 'Loading teachers...'}
        </span>
      </div>
    );
  }

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Selected Teacher Display Card */}
      {selectedTeacher ? (
        <div className="flex items-center justify-between p-3 border border-primary-fixed-dim bg-primary-light/40 rounded-xl transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center text-sm shadow-sm">
              {getInitials(selectedTeacher.fullName)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-on-surface text-sm">{selectedTeacher.fullName}</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                  GV-{String(selectedTeacher.id).padStart(3, '0')}
                </span>
              </div>
              <div className="text-xs text-on-surface-variant">{selectedTeacher.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-outline-variant hover:bg-surface text-on-surface transition-colors"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isVi ? 'Đổi giáo viên' : 'Change'}
            </button>
            <button
              type="button"
              className="p-1.5 rounded-lg hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"
              onClick={() => {
                onSelectTeacher(null);
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
          className="w-full flex items-center justify-between px-3.5 py-2.5 border border-outline-variant rounded-xl bg-surface hover:border-primary text-left text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2.5 text-on-surface-variant">
            <Search size={16} />
            <span>{isVi ? '-- Tìm và chọn Giảng viên phụ trách --' : '-- Search & Select Instructor --'}</span>
          </div>
          <ChevronDown size={16} className={`text-on-surface-variant transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* Dropdown Menu with Live Search */}
      {isOpen && (
        <div className="absolute z-30 left-0 right-0 mt-1.5 bg-surface border border-outline-variant rounded-xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95">
          <div className="p-2.5 border-b border-outline-variant bg-surface-low">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-on-surface"
                placeholder={isVi ? 'Tìm theo tên, email hoặc mã GV...' : 'Search by name, email or code...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            {filteredTeachers.length === 0 ? (
              <div className="py-6 text-center text-sm text-on-surface-variant">
                {isVi ? 'Không tìm thấy giảng viên nào phù hợp' : 'No instructors found'}
              </div>
            ) : (
              filteredTeachers.map(tc => {
                const isSelected = String(tc.id) === String(selectedTeacherId);
                return (
                  <div
                    key={tc.id}
                    className={`flex items-center justify-between px-3.5 py-2.5 cursor-pointer hover:bg-surface-hover transition-colors ${
                      isSelected ? 'bg-primary-light/40 font-semibold' : ''
                    }`}
                    onClick={() => {
                      onSelectTeacher(tc);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                        {getInitials(tc.fullName)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-on-surface font-medium">{tc.fullName}</span>
                          <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-surface-low text-on-surface-variant">
                            GV-{String(tc.id).padStart(3, '0')}
                          </span>
                        </div>
                        <div className="text-xs text-on-surface-variant">{tc.email}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-primary">
                        <Check size={16} />
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
