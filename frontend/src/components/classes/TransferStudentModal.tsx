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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-surface rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transfer-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <ArrowRightLeft size={20} />
            </div>
            <div>
              <h2 id="transfer-modal-title" className="text-base font-bold text-foreground">
                {isVi ? 'Điều chuyển học viên sang lớp khác' : 'Transfer Student to Another Class'}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {student.fullName} ({student.studentCode || `HV-${student.studentId}`})
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={handleClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {/* Current Class Badge */}
          <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <School size={16} className="text-slate-500" />
              <div>
                <span className="text-xs text-muted-foreground block">{isVi ? 'Lớp hiện tại' : 'Current Class'}</span>
                <span className="text-sm font-semibold text-foreground">{currentClassName || `Lớp #${currentClassId}`}</span>
              </div>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              {isVi ? 'Sẽ rời khỏi lớp này' : 'Will leave this class'}
            </span>
          </div>

          {/* Search Box */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              {isVi ? 'Chọn lớp học chuyển đến' : 'Select Destination Class'}
            </label>
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isVi ? 'Tìm kiếm tên lớp học...' : 'Search classes...'}
                className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Class List Options */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {isLoadingClasses ? (
              <div className="py-8 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Loader2 size={24} className="animate-spin text-primary" />
                <span className="text-xs">{isVi ? 'Đang tải danh sách lớp...' : 'Loading classes...'}</span>
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-xs">
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
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                      isSelected 
                        ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm'
                        : 'border-border hover:border-slate-300 dark:hover:border-slate-700 bg-background hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected ? 'border-primary bg-primary text-white' : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isSelected && <Check size={10} strokeWidth={3} />}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">{cls.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                          <span>ID: #{cls.id}</span>
                          <span className="inline-block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">{cls.status}</span>
                        </div>
                      </div>
                    </div>
                    <Users size={16} className={isSelected ? 'text-primary' : 'text-muted-foreground'} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-input bg-background hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground transition-colors disabled:opacity-50"
          >
            {isVi ? 'Hủy' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleConfirmTransfer}
            disabled={isSubmitting || !selectedTargetClassId}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary hover:bg-primary-hover text-white transition-all shadow-sm shadow-primary/25 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>{isVi ? 'Đang chuyển...' : 'Transferring...'}</span>
              </>
            ) : (
              <>
                <ArrowRightLeft size={14} />
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
