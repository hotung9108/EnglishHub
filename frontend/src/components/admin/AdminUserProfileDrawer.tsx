import { useEffect, useEffectEvent, useId, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { parseApiError, type ApiClientError } from '../../api/core/errors';
import { userService, type UpdateUserPayload, type UserProfile } from '../../api/services/user.service';
import { useLanguage } from '../../contexts/LanguageContext';
import { normalizeFullName, validateFullName } from '../../utils/nameValidation';
import { validatePhone } from '../../utils/phoneValidation';
import { Button } from '../common/Button';
import { ConfirmModal } from '../common/ConfirmModal';

const MAX_SPECIALIZATION_LENGTH = 150;

type EditableProfile = UserProfile & { role: 'TEACHER' | 'STUDENT' };
type EditableField = 'fullName' | 'phone' | 'specialization' | 'dateOfBirth';
type Draft = Record<EditableField, string>;
type ProfileChanges = Pick<UpdateUserPayload, EditableField>;
type FieldErrors = Partial<Record<EditableField, string>>;

interface AdminUserProfileDrawerProps {
  profile: EditableProfile;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface FormField {
  name: EditableField;
  label: string;
  type?: 'tel';
  maxLength?: number;
  placeholder?: string;
}

function createDraft(profile: EditableProfile): Draft {
  return {
    fullName: profile.fullName,
    phone: profile.phone ?? '',
    specialization: profile.specialization ?? '',
    dateOfBirth: profile.dateOfBirth ?? '',
  };
}

function normalizeDraft(draft: Draft): Draft {
  return {
    fullName: normalizeFullName(draft.fullName),
    phone: draft.phone.trim(),
    specialization: draft.specialization.trim(),
    dateOfBirth: draft.dateOfBirth.trim() ? draft.dateOfBirth : '',
  };
}

function getProfileChanges(draft: Draft, baseline: Draft, fields: FormField[]): ProfileChanges {
  const changes: ProfileChanges = {};
  for (const { name } of fields) {
    if (draft[name] !== baseline[name]) changes[name] = draft[name];
  }
  return changes;
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthLengths = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= monthLengths[month - 1];
}

function getLocalToday(): string {
  const now = new Date();
  const year = String(now.getFullYear()).padStart(4, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function validateBirthDate(value: string, baseline: string, isVi: boolean): string | undefined {
  if (!value) {
    if (!baseline) return;
    return isVi ? 'Không thể xóa ngày sinh đã lưu.' : 'A saved date of birth cannot be cleared.';
  }
  if (!isCalendarDate(value)) {
    return isVi ? 'Nhập ngày sinh hợp lệ theo định dạng YYYY-MM-DD.' : 'Enter a valid date of birth in YYYY-MM-DD format.';
  }
  if (value > getLocalToday()) {
    return isVi ? 'Ngày sinh không được sau hôm nay.' : 'Date of birth cannot be in the future.';
  }
}

function validateDraft(draft: Draft, baseline: Draft, isTeacher: boolean, isVi: boolean): FieldErrors {
  const errors: FieldErrors = {
    fullName: validateFullName(draft.fullName, isVi).errorMessage ?? undefined,
    phone: validatePhone(draft.phone, isVi).errorMessage ?? undefined,
  };
  if (!isTeacher) {
    errors.dateOfBirth = validateBirthDate(draft.dateOfBirth, baseline.dateOfBirth, isVi);
  } else if (draft.specialization.length > MAX_SPECIALIZATION_LENGTH) {
    errors.specialization = isVi
      ? `Chuyên môn không được vượt quá ${MAX_SPECIALIZATION_LENGTH} ký tự.`
      : `Specialization cannot exceed ${MAX_SPECIALIZATION_LENGTH} characters.`;
  }
  return errors;
}

function getSaveErrorMessage(error: ApiClientError, isVi: boolean): string {
  switch (error.statusCode) {
    case 400:
      return error.message;
    case 403:
      return isVi ? 'Bạn không có quyền sửa hồ sơ này.' : 'You do not have permission to edit this profile.';
    case 404:
      return isVi ? 'Hồ sơ này không còn khả dụng.' : 'This profile is no longer available.';
    case 0:
      return isVi ? 'Mất kết nối mạng. Kiểm tra kết nối rồi thử lại.' : 'Network connection lost. Check your connection and try again.';
    case 408:
      return isVi ? 'Yêu cầu lưu quá thời gian chờ. Vui lòng thử lại.' : 'The save request timed out. Please try again.';
    default:
      return isVi ? 'Không thể lưu hồ sơ. Vui lòng thử lại.' : 'Could not save the profile. Please try again.';
  }
}

function getFocusableControls(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>('button, input'))
    .filter(control => control.tabIndex >= 0 && !control.matches(':disabled'));
}

type DrawerSessionProps = Omit<AdminUserProfileDrawerProps, 'isOpen'>;

function DrawerSession({ profile, onClose, onSaved }: DrawerSessionProps) {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const [snapshot] = useState(profile);
  const isTeacher = snapshot.role === 'TEACHER';
  const [baseline] = useState(() => normalizeDraft(createDraft(snapshot)));
  const [draft, setDraft] = useState(() => createDraft(snapshot));
  const [attempted, setAttempted] = useState(false);
  const [saveError, setSaveError] = useState<ApiClientError | null>(null);
  const [pending, setPending] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const saving = useRef(false);
  const mounted = useRef(false);
  const restoreEditingFocus = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const fields: FormField[] = [
    { name: 'fullName', label: isVi ? 'Họ và tên' : 'Full name' },
    { name: 'phone', label: isVi ? 'Số điện thoại' : 'Phone', type: 'tel' },
    isTeacher
      ? { name: 'specialization', label: isVi ? 'Chuyên môn' : 'Specialization', maxLength: MAX_SPECIALIZATION_LENGTH }
      : { name: 'dateOfBirth', label: isVi ? 'Ngày sinh' : 'Date of birth', placeholder: 'YYYY-MM-DD' },
  ];
  const normalized = normalizeDraft(draft);
  const changes = getProfileChanges(normalized, baseline, fields);
  const dirty = Object.keys(changes).length > 0;
  const fieldErrors = attempted ? validateDraft(normalized, baseline, isTeacher, isVi) : {};
  const saveBlocked = saveError?.statusCode === 403 || saveError?.statusCode === 404;

  function requestClose() {
    if (saving.current) return;
    if (dirty) {
      setShowDiscard(true);
      return;
    }
    onClose();
  }

  const closeFromKeyboard = useEffectEvent(requestClose);

  useLayoutEffect(() => {
    const opener = document.activeElement;
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || showDiscard) return;

    const firstControl = getFocusableControls(panel)[0];
    const focusTarget = restoreEditingFocus.current ? panel.querySelector<HTMLInputElement>('input') : firstControl;
    (focusTarget ?? panel).focus();
    restoreEditingFocus.current = false;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeFromKeyboard();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;

      const controls = getFocusableControls(panel);
      const active = document.activeElement;
      const first = controls[0];
      const last = controls.at(-1);
      if (controls.some(control => control === active) && active !== (event.shiftKey ? first : last)) return;
      event.preventDefault();
      const next = event.shiftKey ? last : first;
      (next ?? panel).focus();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDiscard]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current || saveBlocked || showDiscard || !dirty) return;
    setAttempted(true);
    const errors = validateDraft(normalized, baseline, isTeacher, isVi);
    if (Object.values(errors).some(Boolean)) return;

    saving.current = true;
    setPending(true);
    setSaveError(null);
    try {
      await userService.updateUser(snapshot.id, changes);
    } catch (error) {
      if (mounted.current) {
        setSaveError(parseApiError(error));
        saving.current = false;
        setPending(false);
      }
      return;
    }
    if (!mounted.current) return;
    onSaved();
    onClose();
  }

  const cancelText = isVi ? 'Hủy' : 'Cancel';
  const closeText = isVi ? 'Đóng' : 'Close';

  if (showDiscard) {
    return (
      <ConfirmModal
        isOpen
        trapFocus
        title={isVi ? 'Bỏ thay đổi?' : 'Discard changes?'}
        message={isVi ? 'Các thay đổi chưa lưu sẽ bị mất.' : 'Your unsaved changes will be lost.'}
        closeLabel={closeText}
        cancelText={isVi ? 'Tiếp tục chỉnh sửa' : 'Keep editing'}
        confirmText={isVi ? 'Bỏ thay đổi' : 'Discard changes'}
        onCancel={() => {
          restoreEditingFocus.current = true;
          setShowDiscard(false);
        }}
        onConfirm={onClose}
      />
    );
  }

  const roleLabel = isTeacher ? (isVi ? 'Giáo viên' : 'Teacher') : (isVi ? 'Học viên' : 'Student');
  let statusLabel = '—';
  if (snapshot.status === 'LOCKED') statusLabel = isVi ? 'Bị khóa' : 'Locked';
  if (snapshot.status === 'ACTIVE') statusLabel = isVi ? 'Đang hoạt động' : 'Active';

  return (
    <div className="adm-drawer-backdrop" onClick={event => {
      if (event.target === event.currentTarget) requestClose();
    }}>
      <div ref={panelRef} className="adm-drawer" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <div className="adm-drawer-header">
          <h2 id={titleId} className="adm-drawer-title">{isVi ? 'Chỉnh sửa hồ sơ' : 'Edit profile'}</h2>
          <button type="button" className="btn-ghost p-1 cursor-pointer" aria-label={closeText} disabled={pending} onClick={requestClose}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form noValidate onSubmit={save} aria-busy={pending} className="flex flex-col flex-1">
          <div className="adm-drawer-body">
            {saveError && <div className="adm-alert-error" role="alert">{getSaveErrorMessage(saveError, isVi)}</div>}

            <dl className="adm-form-grid">
              <div><dt className="adm-form-label">Email</dt><dd className="m-0 break-all">{snapshot.email}</dd></div>
              <div><dt className="adm-form-label">{isVi ? 'Vai trò' : 'Role'}</dt><dd className="m-0">{roleLabel}</dd></div>
              <div><dt className="adm-form-label">{isVi ? 'Trạng thái' : 'Status'}</dt><dd className="m-0">{statusLabel}</dd></div>
              {!isTeacher && (
                <div><dt className="adm-form-label">{isVi ? 'Mã học viên' : 'Student code'}</dt><dd className="m-0">{snapshot.studentCode || '—'}</dd></div>
              )}
            </dl>

            {fields.map(({ name, label, type, maxLength, placeholder }) => {
              const id = `${titleId}-${name}`;
              const errorId = `${id}-error`;
              const serverError = saveError?.statusCode === 400
                ? saveError.errors?.find(error => error.field === name)?.message
                : undefined;
              const error = fieldErrors[name] || serverError;
              return (
                <div className="adm-form-group" key={name}>
                  <label className="adm-form-label" htmlFor={id}>{label}</label>
                  <input
                    id={id}
                    name={name}
                    type={type ?? 'text'}
                    className={error ? 'input adm-input-error' : 'input'}
                    value={draft[name]}
                    disabled={pending}
                    required={name === 'fullName'}
                    maxLength={maxLength}
                    placeholder={placeholder}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                    onChange={event => {
                      setDraft({ ...draft, [name]: event.target.value });
                      if (saveError?.statusCode === 400) setSaveError(null);
                    }}
                  />
                  {error && <span id={errorId} className="adm-form-field-error">{error}</span>}
                </div>
              );
            })}
          </div>

          <div className="adm-drawer-footer">
            <Button variant="secondary" type="button" disabled={pending} onClick={requestClose}>{cancelText}</Button>
            <Button type="submit" loading={pending} disabled={!dirty || saveBlocked}>
              {isVi ? 'Lưu thay đổi' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdminUserProfileDrawer({ isOpen, ...props }: AdminUserProfileDrawerProps) {
  return isOpen ? <DrawerSession key={props.profile.id} {...props} /> : null;
}
