import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminGradingAuditLogs } from '../../pages/AdminGradingAuditLogs';
import { gradingService } from '../../api/services/grading.service';
import { gradingChangeLogService } from '../../api/services/grading-change-log.service';
import type { 
  GradingSummaryResponse, 
  GradingDetailResponse, 
  GradingListResponse 
} from '../../api/services/grading.service';
import type { GradingChangeLogListResponse } from '../../api/services/grading-change-log.service';
import { renderPage } from './renderPage';

const mockGradings: GradingSummaryResponse[] = [
  {
    id: 101,
    status: 'COMPLETED',
    finalScore: 8.5,
    assignmentTitle: 'IELTS Writing Task 2 - Technology',
    className: 'IELTS Intensive 6.5+',
    teacherName: 'Nguyễn Văn Minh',
    studentName: 'Trần Văn Nam',
    gradedAt: '2026-11-20T10:30:00Z',
  },
  {
    id: 102,
    status: 'AI_GRADED',
    finalScore: null,
    assignmentTitle: 'Speaking Mock Test 1',
    className: 'Tiếng Anh Giao Tiếp A1',
    teacherName: 'Lê Thị Hoa',
    studentName: 'Phạm Hồng Anh',
    gradedAt: '2026-11-21T14:15:00Z',
  },
  {
    id: 103,
    status: 'PENDING',
    finalScore: null,
    assignmentTitle: 'Reading Comprehension Unit 3',
    className: 'IELTS Foundation K1',
    teacherName: 'Hoàng Quốc Việt',
    studentName: 'Đặng Tuấn Kiệt',
    gradedAt: null,
  },
  {
    id: 104,
    status: 'FAILED',
    finalScore: null,
    assignmentTitle: 'Audio Accent Analysis',
    className: 'IELTS Advanced Pronunciation',
    teacherName: 'Trần Đình Trọng',
    studentName: 'Vũ Minh Trí',
    gradedAt: null,
  },
];

const mockListResponse: GradingListResponse = {
  data: mockGradings,
  pagination: {
    page: 1,
    limit: 10,
    total: 4,
  },
};

const mockGradingDetail: GradingDetailResponse = {
  id: 101,
  submissionModuleId: 501,
  method: 'TEACHER_MANUAL',
  status: 'COMPLETED',
  aiFeedback: 'Bài viết có bố cục tốt, vốn từ vựng phong phú.',
  aiTranscript: null,
  finalScore: 8.5,
  finalFeedback: 'Lập luận chặt chẽ, cải thiện thêm phần kết bài.',
  maxScoreSnapshot: 10,
  reviewedBy: 9,
  reviewedAt: '2026-11-20T10:35:00Z',
  gradedAt: '2026-11-20T10:30:00Z',
  aiInstructionSnapshot: null,
};

const mockChangeLogsResponse: GradingChangeLogListResponse = {
  data: [
    {
      oldScore: 8.0,
      newScore: 8.5,
      note: 'Điều chỉnh điểm sau khi xem xét lại tiêu chí Coherence',
      changedBy: 'Nguyễn Văn Minh (GV-0009)',
      changedAt: '2026-11-20T10:35:00Z',
    },
  ],
};

function renderAuditLogs(lang: 'vi' | 'en' = 'vi') {
  return renderPage(<AdminGradingAuditLogs />, '/admin/audit/gradings', '/admin/audit/gradings', undefined, lang);
}

describe('AdminGradingAuditLogs (FE-106 / BE-89)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(gradingService, 'listGradings').mockResolvedValue(mockListResponse);
    vi.spyOn(gradingService, 'getById').mockResolvedValue(mockGradingDetail);
    vi.spyOn(gradingChangeLogService, 'getChangeLogs').mockResolvedValue(mockChangeLogsResponse);
  });

  it('renders table with enriched assignment, class, teacher, student and status badges', async () => {
    renderAuditLogs();

    await waitFor(() => {
      expect(screen.getByText('GR-101')).toBeVisible();
    });

    expect(screen.getByText('IELTS Writing Task 2 - Technology')).toBeVisible();
    expect(screen.getByText('IELTS Intensive 6.5+')).toBeVisible();
    expect(screen.getByText('Nguyễn Văn Minh')).toBeVisible();
    expect(screen.getByText('Trần Văn Nam')).toBeVisible();
    expect(screen.getByText('8.5')).toBeVisible();
    expect(screen.getByText('Đã hoàn thành')).toBeVisible();

    expect(screen.getByText('GR-102')).toBeVisible();
    expect(screen.getByText('Speaking Mock Test 1')).toBeVisible();
    expect(screen.getAllByText('Đánh giá tự động').length).toBeGreaterThanOrEqual(2);
  });

  it('filters rows by status segment pills', async () => {
    const user = userEvent.setup();
    renderAuditLogs();

    await waitFor(() => {
      expect(screen.getByText('GR-101')).toBeVisible();
    });

    // Click on Automated Evaluation pill
    const aiGradedBtn = screen.getByRole('button', { name: /Đánh giá tự động/i });
    await user.click(aiGradedBtn);

    expect(screen.getByText('GR-102')).toBeVisible();
    expect(screen.queryByText('GR-101')).not.toBeInTheDocument();
    expect(screen.queryByText('GR-103')).not.toBeInTheDocument();

    // Click on Pending pill
    const pendingBtn = screen.getByRole('button', { name: /Chờ duyệt/i });
    await user.click(pendingBtn);

    expect(screen.getByText('GR-103')).toBeVisible();
    expect(screen.queryByText('GR-102')).not.toBeInTheDocument();
  });

  it('filters rows by score dropdown (SCORED vs UNSCORED)', async () => {
    renderAuditLogs();

    await waitFor(() => {
      expect(screen.getByText('GR-101')).toBeVisible();
    });

    const scoreSelect = screen.getByLabelText(/Lọc theo mức điểm/i);
    fireEvent.change(scoreSelect, { target: { value: 'SCORED' } });

    expect(screen.getByText('GR-101')).toBeVisible();
    expect(screen.queryByText('GR-102')).not.toBeInTheDocument();
    expect(screen.queryByText('GR-103')).not.toBeInTheDocument();

    fireEvent.change(scoreSelect, { target: { value: 'UNSCORED' } });
    expect(screen.queryByText('GR-101')).not.toBeInTheDocument();
    expect(screen.getByText('GR-102')).toBeVisible();
  });

  it('filters rows by search input query', async () => {
    const user = userEvent.setup();
    renderAuditLogs();

    await waitFor(() => {
      expect(screen.getByText('GR-101')).toBeVisible();
    });

    const searchInput = screen.getByPlaceholderText(/Tìm mã GR-\.\.\./i);
    await user.type(searchInput, 'Technology');

    expect(screen.getByText('GR-101')).toBeVisible();
    expect(screen.queryByText('GR-102')).not.toBeInTheDocument();
    expect(screen.queryByText('GR-103')).not.toBeInTheDocument();

    // Search by teacher name
    await user.clear(searchInput);
    await user.type(searchInput, 'Lê Thị Hoa');

    expect(screen.queryByText('GR-101')).not.toBeInTheDocument();
    expect(screen.getByText('GR-102')).toBeVisible();
  });

  it('opens drawer and displays grading context and change logs history', async () => {
    const user = userEvent.setup();
    renderAuditLogs();

    await waitFor(() => {
      expect(screen.getByText('GR-101')).toBeVisible();
    });

    // Click on row GR-101
    await user.click(screen.getByText('GR-101'));

    await waitFor(() => {
      expect(screen.getByText(/Chi Tiết Kiểm Toán & Lịch Sử Sửa Điểm: GR-101/i)).toBeVisible();
    });

    expect(gradingService.getById).toHaveBeenCalledWith(101);
    expect(gradingChangeLogService.getChangeLogs).toHaveBeenCalledWith(101);

    expect(screen.getByText('Lập luận chặt chẽ, cải thiện thêm phần kết bài.')).toBeVisible();
    expect(screen.getByText('Bài viết có bố cục tốt, vốn từ vựng phong phú.')).toBeVisible();
    expect(screen.getByText('Điều chỉnh điểm sau khi xem xét lại tiêu chí Coherence')).toBeVisible();
    expect(screen.getByText('Nguyễn Văn Minh (GV-0009)')).toBeVisible();

    // Close drawer
    const closeBtns = screen.getAllByRole('button', { name: /Đóng/i });
    await user.click(closeBtns[0]);

    await waitFor(() => {
      expect(screen.queryByText(/Chi Tiết Kiểm Toán & Lịch Sử Sửa Điểm/i)).not.toBeInTheDocument();
    });
  });

  it('renders empty state when search finds no results and allows reset', async () => {
    const user = userEvent.setup();
    renderAuditLogs();

    await waitFor(() => {
      expect(screen.getByText('GR-101')).toBeVisible();
    });

    const searchInput = screen.getByPlaceholderText(/Tìm mã GR-\.\.\./i);
    await user.type(searchInput, 'NonExistentTitleXYZ');

    expect(screen.getByText('Không tìm thấy hồ sơ chấm điểm nào')).toBeVisible();

    const resetBtn = screen.getByRole('button', { name: /Đặt lại bộ lọc/i });
    await user.click(resetBtn);

    expect(screen.getByText('GR-101')).toBeVisible();
  });

  it('handles API loading failure and allows retry', async () => {
    const user = userEvent.setup();
    vi.spyOn(gradingService, 'listGradings').mockRejectedValueOnce(new Error('Network connection timeout'));

    renderAuditLogs();

    await waitFor(() => {
      expect(screen.getByText('Network connection timeout')).toBeVisible();
    });

    const retryBtn = screen.getByRole('button', { name: /Thử lại/i });
    await user.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('GR-101')).toBeVisible();
    });
  });

  it('triggers CSV export when clicking export button', async () => {
    const user = userEvent.setup();
    renderAuditLogs();

    await waitFor(() => {
      expect(screen.getByText('GR-101')).toBeVisible();
    });

    const createObjectURL = vi.fn().mockReturnValue('blob:mock-csv-url');
    const revokeObjectURL = vi.fn();
    window.URL.createObjectURL = createObjectURL;
    window.URL.revokeObjectURL = revokeObjectURL;

    const exportBtn = screen.getByRole('button', { name: /Xuất CSV/i });
    await user.click(exportBtn);

    expect(screen.getByText('GR-101')).toBeVisible();
  });
});
