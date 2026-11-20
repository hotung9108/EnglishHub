import {
  ArrowRight, BookOpen, Clock, Edit2, GraduationCap, Headphones, Mic, PenTool, Sparkles, Trash2,
} from 'lucide-react';
import type { AssignmentSkill, AssignmentStatus } from '../../api/services/assignment.service';
import { toSkillBadgeTypes, type AssignmentBadgeType } from '../../utils/assignmentSkills';
import { Button } from '../common/Button';
import { StatusBadge, type StatusType } from '../common/StatusBadge';

export interface AssignmentDisplayItem {
  id: string;
  classId: number;
  code: string;
  skills: AssignmentSkill[];
  title: string;
  className: string;
  dueDate: string;
  daysLeft?: number;
  closeDate?: Date | null;
  closeAt: string | null;
  openAt?: string | null;
  totalStudents: number;
  submittedCount: number;
  pendingGradingCount: number;
  status: 'open' | 'closed' | 'upcoming';
  lifecycleStatus: AssignmentStatus;
}

const lifecycleBadges: Record<AssignmentStatus, { tone: StatusType; vi: string; en: string }> = {
  DRAFT: { tone: 'neutral', vi: 'Nháp', en: 'Draft' },
  PUBLISHED: { tone: 'success', vi: 'Đã mở', en: 'Published' },
  CLOSED: { tone: 'neutral', vi: 'Đã khóa', en: 'Closed' },
};

interface AssignmentCardProps {
  item: AssignmentDisplayItem;
  isVi: boolean;
  currentTimestamp: number;
  onViewDetails: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  onViewSubmissions: () => void;
  onChangeLifecycle: (item: AssignmentDisplayItem) => void;
  isUpdatingLifecycle: boolean;
}

export function AssignmentCard({
  item,
  isVi,
  currentTimestamp,
  onViewDetails,
  onEdit,
  onDelete,
  onViewSubmissions,
  onChangeLifecycle,
  isUpdatingLifecycle,
}: AssignmentCardProps) {
  const getSkillBadge = (type: AssignmentBadgeType) => {
    switch (type) {
      case 'writing':
        return (
          <span key={type} className="teacher-skill-mini-badge writing">
            <PenTool size={11} />
            <span>Writing</span>
          </span>
        );
      case 'speaking':
        return (
          <span key={type} className="teacher-skill-mini-badge speaking">
            <Mic size={11} />
            <span>Speaking</span>
          </span>
        );
      case 'reading':
        return (
          <span key={type} className="teacher-skill-mini-badge reading">
            <BookOpen size={11} />
            <span>Reading</span>
          </span>
        );
      case 'listening':
        return (
          <span key={type} className="teacher-skill-mini-badge listening">
            <Headphones size={11} />
            <span>Listening</span>
          </span>
        );
    }
    return null;
  };

  const renderSkillBadges = (skills: AssignmentSkill[]) => {
    const badgeTypes = toSkillBadgeTypes(skills);
    if (badgeTypes.length === 4) {
      return (
        <span className="teacher-skill-combined-badge" title="Reading, Listening, Writing, Speaking">
          <Sparkles size={11} />
          <span>{isVi ? '4 Kỹ năng' : '4 Skills'}</span>
        </span>
      );
    }
    return (
      <div className="teacher-assignment-skills-wrap">
        {badgeTypes.map(getSkillBadge)}
      </div>
    );
  };

  const renderDeadlineTag = (item: AssignmentDisplayItem) => {
    if (!item.closeDate || isNaN(item.closeDate.getTime())) {
      return (
        <span className="teacher-assignment-deadline-tag">
          <Clock size={11} />
          <span>{isVi ? 'Không thời hạn' : 'No deadline'}</span>
        </span>
      );
    }

    const d = item.closeDate;
    const now = new Date(currentTimestamp);
    const isToday = d.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = d.toDateString() === tomorrow.toDateString();

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dateStr = `${day}/${month}`;

    if (item.status === 'closed') {
      return (
        <span className="teacher-assignment-deadline-tag expired">
          <Clock size={11} />
          <span>{isVi ? `Đã đóng (${dateStr})` : `Closed (${dateStr})`}</span>
        </span>
      );
    }

    if (isToday) {
      return (
        <span className="teacher-assignment-deadline-tag urgent">
          <Clock size={11} />
          <span>{isVi ? `Hết hạn hôm nay • ${timeStr}` : `Due today • ${timeStr}`}</span>
        </span>
      );
    }

    if (isTomorrow) {
      return (
        <span className="teacher-assignment-deadline-tag urgent">
          <Clock size={11} />
          <span>{isVi ? `Hạn ngày mai • ${timeStr}` : `Due tomorrow • ${timeStr}`}</span>
        </span>
      );
    }

    return (
      <span className="teacher-assignment-deadline-tag">
        <Clock size={11} />
        <span>{isVi ? `Hạn nộp: ${timeStr}, ${dateStr}` : `Due: ${timeStr}, ${dateStr}`}</span>
        {item.daysLeft !== undefined && item.daysLeft > 0 && (
          <span className="teacher-assignment-deadline-sub">
            {isVi ? `(Còn ${item.daysLeft} ngày)` : `(${item.daysLeft}d left)`}
          </span>
        )}
      </span>
    );
  };

  const submissionPercent = item.totalStudents > 0
    ? Math.min(100, Math.round((item.submittedCount / item.totalStudents) * 100))
    : 0;
  const lifecycleBadge = lifecycleBadges[item.lifecycleStatus];
  const isPublished = item.lifecycleStatus === 'PUBLISHED';
  const isClosed = item.lifecycleStatus === 'CLOSED';

  return (
    <div className="teacher-assignment-card">
      {/* 1. Header Line: Identity (Code, Class, Skills) & Grading Status */}
      <div className="teacher-assignment-card-header">
        <div className="teacher-assignment-card-identity">
          <span className="teacher-assignment-code-badge">{item.code}</span>
          <div className="teacher-assignment-class-tag">
            <GraduationCap size={13} />
            <span>{item.className}</span>
          </div>
          {renderSkillBadges(item.skills)}
          <StatusBadge status={lifecycleBadge.tone} label={isVi ? lifecycleBadge.vi : lifecycleBadge.en} />
        </div>

        <div className="teacher-assignment-card-status">
          {item.submittedCount === 0 ? (
            <span className="teacher-assignment-upcoming-pill">
              <span className="teacher-assignment-status-dot" style={{ backgroundColor: '#94a3b8' }} />
              <span>{isVi ? 'Chưa có bài nộp' : 'No submissions'}</span>
            </span>
          ) : item.pendingGradingCount > 0 ? (
            <span className="teacher-assignment-pending-pill">
              <span className="teacher-assignment-status-dot pending" />
              <span>{item.pendingGradingCount} {isVi ? 'bài chờ chấm' : 'to grade'}</span>
            </span>
          ) : (
            <span className="teacher-assignment-done-pill">
              <span className="teacher-assignment-status-dot done" />
              <span>{isVi ? 'Đã chấm hoàn tất' : 'All graded'}</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Main Title */}
      <h3
        onClick={() => onViewDetails()}
        className="teacher-assignment-title"
      >
        {item.title}
      </h3>

      {/* 3. Divider */}
      <div className="teacher-assignment-card-divider" />

      {/* 4. Footer Line: Deadline & Turnout Progress (Left) + Actions (Right) */}
      <div className="teacher-assignment-card-footer">
        <div className="teacher-assignment-footer-meta">
          {renderDeadlineTag(item)}

          <span className="teacher-assignment-meta-separator">•</span>

          <div className="teacher-assignment-turnout-group">
            <span className="teacher-assignment-turnout-label">
              {isVi ? 'Đã nộp:' : 'Turnout:'} <strong>{item.submittedCount}/{item.totalStudents}</strong> ({submissionPercent}%)
            </span>
            <div className="teacher-assignment-mini-progress">
              <div
                className="teacher-assignment-mini-fill"
                style={{ width: `${submissionPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="teacher-assignment-card-actions">
          {item.status !== 'closed' && !isClosed && (
            <button
              type="button"
              className="teacher-assignment-btn-edit"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              title={isVi ? 'Chỉnh sửa bài tập này' : 'Edit this assignment'}
            >
              <Edit2 size={13} />
              <span>{isVi ? 'Chỉnh sửa' : 'Edit'}</span>
            </button>
          )}

          <Button
            type="button"
            variant={isPublished ? 'danger' : 'secondary'}
            size="sm"
            disabled={isUpdatingLifecycle}
            onClick={() => onChangeLifecycle(item)}
          >
            {isPublished ? (isVi ? 'Khóa bài tập' : 'Close assignment') : (isVi ? 'Mở bài tập' : 'Open assignment')}
          </Button>

          {onDelete && (
            <button
              type="button"
              className="teacher-assignment-btn-delete"
              onClick={onDelete}
              title={isVi ? 'Xóa bài tập' : 'Delete Assignment'}
            >
              <Trash2 size={13} />
              <span>{isVi ? 'Xóa bài tập' : 'Delete Assignment'}</span>
            </button>
          )}

          <button
            type="button"
            className="teacher-assignment-btn-primary"
            onClick={() => onViewSubmissions()}
          >
            <span>
              {item.pendingGradingCount > 0
                ? (isVi ? 'Chấm bài ngay' : 'Grade Now')
                : (isVi ? 'Quản lý bài nộp' : 'View Submissions')}
            </span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
