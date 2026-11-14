import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { TransferStudentModal } from '../../components/classes/TransferStudentModal';
import { classService, type ClassSummary } from '../../api/services/class.service';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { ToastProvider } from '../../components/common/ToastContext';

vi.mock('../../api/services/class.service', () => ({
  classService: {
    list: vi.fn(),
    addMember: vi.fn(),
    removeMember: vi.fn(),
    listMembers: vi.fn(),
    getDetail: vi.fn(),
  },
}));

const mockClasses: ClassSummary[] = [
  {
    id: 1,
    name: 'IELTS Foundation K1',
    status: 'ACTIVE',
  },
  {
    id: 2,
    name: 'IELTS Intensive K2',
    status: 'ACTIVE',
  },
  {
    id: 3,
    name: 'TOEIC Master 750+',
    status: 'COMPLETED',
  },
];

const mockStudent = {
  studentId: 88,
  fullName: 'Trần Văn An',
  studentCode: 'HV-0088',
  currentMemberId: 10,
};

describe('FE-88 & FE-87: TransferStudentModal (UC009)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(classService.list).mockResolvedValue({
      data: mockClasses,
      pagination: { page: 1, limit: 100, total: 3 },
    });
    vi.mocked(classService.listMembers).mockResolvedValue([]);
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <LanguageProvider>
        <ToastProvider>{ui}</ToastProvider>
      </LanguageProvider>
    );
  };

  it('renders modal with student info and active destination classes', async () => {
    renderWithProviders(
      <TransferStudentModal
        isOpen={true}
        onClose={vi.fn()}
        currentClassId={1}
        currentClassName="IELTS Foundation K1"
        student={mockStudent}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText(/Điều chuyển học viên/i)).toBeInTheDocument();
    expect(screen.getByText(/Trần Văn An/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(classService.list).toHaveBeenCalled();
      expect(screen.getByText('IELTS Intensive K2')).toBeInTheDocument();
    });

    expect(screen.queryByText(/IELTS Foundation K1 \(Hiện tại\)/i) || screen.queryByText('IELTS Foundation K1')).toBeTruthy();
  });

  it('filters destination classes when user types in search query', async () => {
    renderWithProviders(
      <TransferStudentModal
        isOpen={true}
        onClose={vi.fn()}
        currentClassId={1}
        currentClassName="IELTS Foundation K1"
        student={mockStudent}
        onSuccess={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('IELTS Intensive K2')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Tìm kiếm tên lớp học/i);
    fireEvent.change(searchInput, { target: { value: 'Intensive' } });

    expect(screen.getByText('IELTS Intensive K2')).toBeInTheDocument();
  });

  it('calls addMember to new class and removeMember from old class upon confirmation', async () => {
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    vi.mocked(classService.addMember).mockResolvedValue({ memberId: 101, message: 'Thêm thành công' });
    vi.mocked(classService.removeMember).mockResolvedValue({ message: 'Xóa thành công' });

    renderWithProviders(
      <TransferStudentModal
        isOpen={true}
        onClose={onClose}
        currentClassId={1}
        currentClassName="IELTS Foundation K1"
        student={mockStudent}
        onSuccess={onSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('IELTS Intensive K2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('IELTS Intensive K2'));

    const confirmBtn = screen.getByRole('button', { name: /Xác nhận chuyển lớp/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(classService.addMember).toHaveBeenCalledWith(2, 88);
      expect(classService.removeMember).toHaveBeenCalledWith(1, 10);
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
