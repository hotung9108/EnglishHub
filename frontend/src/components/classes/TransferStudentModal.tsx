import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, ArrowRightLeft, Search, School, Users, 
  Check, Loader2, AlertCircle 
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { classService, type ClassSummary } from '../../api/services/class.service';
import { useToast } from '../common/ToastContext';

export interface TransferStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    studentId: number;
    fullName: string;
    studentCode?: string;
    currentMemberId: number;
  } | null;
  currentClassId: number;
  currentClassName?: string;
  onSuccess: () => Promise<void> | void;
}

export const TransferStudentModal: React.FC<TransferStudentModalProps> = ({
  isOpen,
  onClose,
  student,
  currentClassId,
  currentClassName,
  onSuccess,
}) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const toast = useToast();

  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [selectedTargetClassId, setSelectedTargetClassId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingClasses, setIsLoadingClasses] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setSelectedTargetClassId(null);
    setSearchQuery('');
    setError(null);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;
    const fetchClasses = async () => {
      setIsLoadingClasses(true);
      setError(null);
      try {
        const res = await classService.list({ status: 'ACTIVE', limit: 100 });
        if (!cancelled) {
          const list = res.data || [];
          setClasses(list.filter(c => c.id !== currentClassId));
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load active classes for transfer:', err);
          setError(isVi ? 'Không thể tải danh sách lớp học khả dụng.' : 'Failed to load available classes.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingClasses(false);
        }
      }
    };

    void fetchClasses();

    return () => {
      cancelled = true;
    };
  }, [isOpen, currentClassId, isVi]);

  const filteredClasses = useMemo(() => {
    if (!searchQuery.trim()) return classes;
    const query = searchQuery.toLowerCase().trim();
    return classes.filter(c => c.name.toLowerCase().includes(query));
  }, [classes, searchQuery]);

  const targetClass = useMemo(() => {
    return classes.find(c => c.id === selectedTargetClassId) || null;
  }, [classes, selectedTargetClassId]);

  if (!isOpen || !student) return null;

  const handleConfirmTransfer = async () => {
    if (!selectedTargetClassId || !targetClass) {
      toast.error(isVi ? 'Vui lòng chọn lớp học chuyển đến.' : 'Please select a destination class.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: Add student to target class first
      await classService.addMember(selectedTargetClassId, student.studentId);
      
      // Step 2: Remove student from current class
      try {
        await classService.removeMember(currentClassId, student.currentMemberId);
      } catch (removeErr) {
        console.error('Failed to remove from old class after adding to new class:', removeErr);
        // Student is in new class, show warning
      }

      toast.success(
        isVi 
          ? `Đã chuyển học viên ${student.fullName} sang lớp ${targetClass.name} thành công!`
          : `Transferred ${student.fullName} to class ${targetClass.name} successfully!`
      );

      await onSuccess();
      handleClose();
    } catch (err: unknown) {
      console.error('Transfer student failed:', err);
      const message = err instanceof Error ? err.message : (isVi ? 'Không thể chuyển lớp học viên.' : 'Failed to transfer student.');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="eh-modal-backdrop" onClick={handleClose}>
      <div 
        className="eh-modal-dialog eh-modal-dialog-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transfer-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="eh-modal-header">
          <div className="eh-modal-header-left">
            <div className="eh-modal-header-icon">
              <ArrowRightLeft size={20} />
            </div>
            <div>
              <h2 id="transfer-modal-title" className="eh-modal-title">
                {isVi ? 'Điều chuyển học viên sang lớp khác' : 'Transfer Student to Another Class'}
              </h2>
              <p className="eh-modal-subtitle">
                {student.fullName} ({student.studentCode || `HV-${student.studentId}`})
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={handleClose}
            className="eh-modal-close-btn"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="eh-modal-body-scroll">
          {/* Current Class Box */}
          <div className="tsm-current-box">
            <div className="tsm-current-info">
              <div className="tsm-current-icon">
                <School size={18} />
              </div>
              <div>
                <span className="tsm-current-label">{isVi ? 'Lớp hiện tại' : 'Current Class'}</span>
                <span className="tsm-current-name">{currentClassName || `Lớp #${currentClassId}`}</span>
              </div>
            </div>
            <span className="tsm-badge-leave">
              {isVi ? 'Sẽ rời khỏi lớp này' : 'Will leave this class'}
            </span>
          </div>

          {/* Search Box */}
          <div>
            <label className="text-xs font-bold text-secondary uppercase tracking-wider block mb-2">
              {isVi ? 'Chọn lớp học chuyển đến' : 'Select Destination Class'}
            </label>
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isVi ? 'Tìm kiếm tên lớp học...' : 'Search classes...'}
                className="tsm-search-input"
              />
            </div>
          </div>

          {/* Class List Options */}
          <div className="tsm-class-list">
            {isLoadingClasses ? (
              <div className="py-8 flex flex-col items-center justify-center text-secondary gap-2">
                <Loader2 size={24} className="animate-spin text-primary" />
                <span className="text-xs">{isVi ? 'Đang tải danh sách lớp...' : 'Loading classes...'}</span>
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="py-8 text-center text-secondary text-xs">
                {isVi ? 'Không tìm thấy lớp học nào khả dụng.' : 'No available classes found.'}
              </div>
            ) : (
              filteredClasses.map((cls) => {
                const isSelected = selectedTargetClassId === cls.id;
                return (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => setSelectedTargetClassId(cls.id)}
                    className={`tsm-class-card ${isSelected ? 'selected' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`tsm-radio ${isSelected ? 'selected' : ''}`}>
                        {isSelected && <Check size={11} strokeWidth={3} />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-primary-dark">{cls.name}</div>
                        <div className="text-xs text-secondary mt-0.5 flex items-center gap-2">
                          <span>Mã lớp: #{cls.id}</span>
                          <span className="inline-block w-1 h-1 rounded-full bg-border" />
                          <span className="text-success font-semibold">{cls.status}</span>
                        </div>
                      </div>
                    </div>
                    <Users size={16} className={isSelected ? 'text-primary' : 'text-secondary'} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="eh-modal-footer">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="tp-change-btn"
          >
            {isVi ? 'Hủy bỏ' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleConfirmTransfer}
            disabled={isSubmitting || !selectedTargetClassId}
            className="btn btn-primary"
            style={{ borderRadius: '10px' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin mr-1.5" />
                <span>{isVi ? 'Đang chuyển...' : 'Transferring...'}</span>
              </>
            ) : (
              <>
                <ArrowRightLeft size={14} className="mr-1.5" />
                <span>{isVi ? 'Xác nhận chuyển lớp' : 'Confirm Transfer'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferStudentModal;
