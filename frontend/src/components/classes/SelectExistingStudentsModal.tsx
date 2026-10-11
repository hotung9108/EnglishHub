import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Search, UserPlus, Users, 
  Check, Loader2, AlertCircle, RefreshCw 
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { userService, type UserListItem } from '../../api/services/user.service';
import { classService } from '../../api/services/class.service';

interface SelectExistingStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: number;
  classNameTitle?: string;
  enrolledStudentIds: number[];
  onSuccess: () => Promise<void> | void;
}

export const SelectExistingStudentsModal: React.FC<SelectExistingStudentsModalProps> = ({
  isOpen,
  onClose,
  classId,
  classNameTitle,
  enrolledStudentIds,
  onSuccess,
}) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const [students, setStudents] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await userService.listUsers({ role: 'STUDENT', limit: 100 });
        if (isMounted) {
          setStudents(res.data || []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : isVi ? 'Không thể tải danh sách học viên.' : 'Failed to load students.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStudents();

    return () => {
      isMounted = false;
    };
  }, [isOpen, isVi, reloadKey]);

  // Set of already enrolled student IDs for quick lookup
  const enrolledSet = useMemo(() => new Set(enrolledStudentIds), [enrolledStudentIds]);

  // Filter available students (exclude those already in class)
  const availableStudents = useMemo(() => {
    return students.filter(st => !enrolledSet.has(st.id));
  }, [students, enrolledSet]);

  // Filter by search query (name, email, or id)
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return availableStudents;
    const q = searchQuery.toLowerCase().trim();
    return availableStudents.filter(st => 
      st.fullName.toLowerCase().includes(q) ||
      st.email.toLowerCase().includes(q) ||
      String(st.id).includes(q) ||
      `hv-${st.id}`.includes(q)
    );
  }, [availableStudents, searchQuery]);

  // Toggle single student selection
  const handleToggleStudent = (studentId: number, isLocked: boolean) => {
    if (isLocked) return;
    setSelectedIds(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Toggle select all active in current filtered view
  const activeFilteredIds = useMemo(() => {
    return filteredStudents.filter(s => s.status === 'ACTIVE').map(s => s.id);
  }, [filteredStudents]);

  const isAllSelected = activeFilteredIds.length > 0 && activeFilteredIds.every(id => selectedIds.includes(id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !activeFilteredIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...activeFilteredIds])));
    }
  };

  // Submit adding selected students into class
  const handleSubmit = async () => {
    if (selectedIds.length === 0 || submitting) return;

    try {
      setSubmitting(true);
      setSubmitError(null);

      // Add each member via classService.addMember
      const results = await Promise.allSettled(
        selectedIds.map(studentId => classService.addMember(classId, studentId))
      );

      const rejected = results.filter(r => r.status === 'rejected');

      if (rejected.length > 0) {
        setSubmitError(
          isVi 
            ? `Đã thêm ${results.length - rejected.length}/${results.length} học viên. Có ${rejected.length} học viên không thể thêm.`
            : `Added ${results.length - rejected.length}/${results.length} students. ${rejected.length} failed.`
        );
      }

      // Refresh parent roster
      await onSuccess();

      if (rejected.length === 0) {
        onClose();
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : isVi ? 'Có lỗi xảy ra khi thêm học viên vào lớp.' : 'Failed to add students to class.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div 
        className="card" 
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--outline-variant, #e2e8f0)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          background: 'var(--surface, #ffffff)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary, #2563eb)'
            }}>
              <UserPlus size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--on-surface)' }}>
                {isVi ? 'Chọn học viên đã có trong hệ thống' : 'Select Existing Students'}
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--on-surface-variant)' }}>
                {isVi 
                  ? `Ghi danh học viên vào lớp ${classNameTitle ? `"${classNameTitle}"` : ''}` 
                  : `Enroll students into class ${classNameTitle ? `"${classNameTitle}"` : ''}`}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '6px', borderRadius: '50%', border: 'none', background: 'transparent' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto' }}>
          {/* Error notifications */}
          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '13px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setReloadKey(k => k + 1)}
                style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}
              >
                <RefreshCw size={13} /> {isVi ? 'Thử lại' : 'Retry'}
              </button>
            </div>
          )}

          {submitError && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              color: '#b45309',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px'
            }}>
              <AlertCircle size={16} />
              <span>{submitError}</span>
            </div>
          )}

          {/* Search bar */}
          <div style={{ position: 'relative' }}>
            <Search 
              size={16} 
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }} 
            />
            <input 
              type="text"
              className="input"
              placeholder={isVi ? 'Tìm kiếm học viên theo tên, email, mã HV...' : 'Search by name, email, student ID...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '38px', width: '100%' }}
              disabled={loading}
            />
          </div>

          {/* Selection counter & bulk action bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            color: 'var(--on-surface-variant)',
            padding: '4px 2px'
          }}>
            <span>
              {isVi 
                ? `Tìm thấy ${filteredStudents.length} học viên khả dụng` 
                : `${filteredStudents.length} available students found`}
            </span>
            {activeFilteredIds.length > 0 && (
              <button
                type="button"
                onClick={handleToggleSelectAll}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary, #2563eb)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '12.5px'
                }}
              >
                {isAllSelected 
                  ? (isVi ? 'Bỏ chọn tất cả' : 'Deselect all') 
                  : (isVi ? 'Chọn tất cả' : 'Select all')}
              </button>
            )}
          </div>

          {/* Student list */}
          <div style={{
            minHeight: '220px',
            maxHeight: '340px',
            overflowY: 'auto',
            border: '1px solid var(--outline-variant, #e2e8f0)',
            borderRadius: '10px',
            backgroundColor: 'var(--surface-container-low, #f8fafc)'
          }}>
            {loading ? (
              <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--on-surface-variant)' }}>
                <Loader2 size={28} className="animate-spin" color="var(--primary, #2563eb)" />
                <span style={{ fontSize: '13.5px' }}>{isVi ? 'Đang tải danh bạ học viên...' : 'Loading student directory...'}</span>
              </div>
            ) : availableStudents.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                <Users size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--on-surface)' }}>
                  {isVi ? 'Tất cả học viên trong hệ thống đã ở trong lớp này' : 'All students are already in this class'}
                </div>
                <div style={{ fontSize: '13px', marginTop: '6px' }}>
                  {isVi ? 'Không còn tài khoản học viên nào khả dụng để thêm.' : 'No other students available to enroll.'}
                </div>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                <Search size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                <div style={{ fontSize: '14px', fontWeight: 600 }}>
                  {isVi ? 'Không tìm thấy học viên nào phù hợp' : 'No matching students found'}
                </div>
                <div style={{ fontSize: '12.5px', marginTop: '4px' }}>
                  {isVi ? 'Thử từ khóa tìm kiếm khác.' : 'Try adjusting your search query.'}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredStudents.map((st) => {
                  const isSelected = selectedIds.includes(st.id);
                  const isLocked = st.status === 'LOCKED';

                  return (
                    <div
                      key={st.id}
                      onClick={() => handleToggleStudent(st.id, isLocked)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--outline-variant, #e2e8f0)',
                        backgroundColor: isSelected ? '#eff6ff' : 'var(--surface, #ffffff)',
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        opacity: isLocked ? 0.6 : 1,
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isLocked}
                          onChange={() => handleToggleStudent(st.id, isLocked)}
                          style={{
                            width: '17px',
                            height: '17px',
                            accentColor: 'var(--primary, #2563eb)',
                            cursor: isLocked ? 'not-allowed' : 'pointer'
                          }}
                        />

                        {/* Initials badge */}
                        <div style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          backgroundColor: isSelected ? '#2563eb' : '#dbeafe',
                          color: isSelected ? '#ffffff' : '#1e40af',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          flexShrink: 0
                        }}>
                          {getInitials(st.fullName)}
                        </div>

                        {/* Info */}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--on-surface)' }}>
                              {st.fullName}
                            </span>
                            <span className="font-mono text-on-surface-variant" style={{ fontSize: '11.5px', backgroundColor: 'var(--surface-container-high, #f1f5f9)', padding: '1px 6px', borderRadius: '4px' }}>
                              HV-{String(st.id).padStart(4, '0')}
                            </span>
                          </div>
                          <div style={{ fontSize: '12.5px', color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {st.email}
                          </div>
                        </div>
                      </div>

                      {/* Status / indicator */}
                      <div>
                        {isLocked ? (
                          <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '11px' }}>
                            {isVi ? 'Bị khóa' : 'Locked'}
                          </span>
                        ) : isSelected ? (
                          <span className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px' }}>
                            <Check size={12} />
                            {isVi ? 'Đã chọn' : 'Selected'}
                          </span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '11px' }}>
                            ACTIVE
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--outline-variant, #e2e8f0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--surface, #ffffff)'
        }}>
          <div style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>
            {isVi ? 'Đã chọn: ' : 'Selected: '}
            <strong style={{ color: 'var(--primary, #2563eb)' }}>
              {selectedIds.length} {isVi ? 'học viên' : 'students'}
            </strong>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              {isVi ? 'Hủy' : 'Cancel'}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={selectedIds.length === 0 || submitting}
              onClick={handleSubmit}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{isVi ? 'Đang thêm vào lớp...' : 'Adding to class...'}</span>
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>
                    {isVi 
                      ? (selectedIds.length > 0 ? `Thêm ${selectedIds.length} học viên vào lớp` : 'Thêm vào lớp') 
                      : (selectedIds.length > 0 ? `Add ${selectedIds.length} to Class` : 'Add to Class')}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectExistingStudentsModal;
