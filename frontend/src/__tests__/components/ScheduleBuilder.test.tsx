import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScheduleBuilder } from '../../components/classes/ScheduleBuilder';

describe('ScheduleBuilder Component', () => {
  it('renders 7 days of the week in grid and default schedule summary', () => {
    const onChange = vi.fn();
    render(
      <ScheduleBuilder
        value="T2 - T4 - T6 (18:00 - 20:00)"
        onChange={onChange}
        isVi={true}
      />
    );

    // 7 day buttons exist
    expect(screen.getByText('T2')).toBeInTheDocument();
    expect(screen.getByText('T3')).toBeInTheDocument();
    expect(screen.getByText('T4')).toBeInTheDocument();
    expect(screen.getByText('T5')).toBeInTheDocument();
    expect(screen.getByText('T6')).toBeInTheDocument();
    expect(screen.getByText('T7')).toBeInTheDocument();
    expect(screen.getByText('CN')).toBeInTheDocument();

    // Summary text
    expect(screen.getByText('T2 - T4 - T6 (18:00 - 20:00)')).toBeInTheDocument();
  });

  it('toggles a day selection and updates schedule', async () => {
    const onChange = vi.fn();
    render(
      <ScheduleBuilder
        value="T2 - T4 - T6 (18:00 - 20:00)"
        onChange={onChange}
        isVi={true}
      />
    );

    // Click T3 button to add T3
    const t3Button = screen.getByText('T3').closest('button')!;
    await userEvent.click(t3Button);

    expect(onChange).toHaveBeenCalledWith('T2 - T3 - T4 - T6 (18:00 - 20:00)');
  });

  it('applies quick day preset when clicked', async () => {
    const onChange = vi.fn();
    render(
      <ScheduleBuilder
        value="T2 - T4 - T6 (18:00 - 20:00)"
        onChange={onChange}
        isVi={true}
      />
    );

    const preset357 = screen.getByRole('button', { name: 'T3 - T5 - T7' });
    await userEvent.click(preset357);

    expect(onChange).toHaveBeenCalledWith('T3 - T5 - T7 (18:00 - 20:00)');
  });

  it('applies shift preset when clicked', async () => {
    const onChange = vi.fn();
    render(
      <ScheduleBuilder
        value="T2 - T4 - T6 (18:00 - 20:00)"
        onChange={onChange}
        isVi={true}
      />
    );

    const morningShift = screen.getByText('Ca sáng').closest('button')!;
    await userEvent.click(morningShift);

    expect(onChange).toHaveBeenCalledWith('T2 - T4 - T6 (08:00 - 10:00)');
  });

  it('shows warning when end time is earlier than or equal to start time', async () => {
    const onChange = vi.fn();
    render(
      <ScheduleBuilder
        value="T2 - T4 - T6 (20:00 - 18:00)"
        onChange={onChange}
        isVi={true}
      />
    );

    expect(screen.getByText('Giờ kết thúc nên sau giờ bắt đầu')).toBeInTheDocument();
  });

  it('switches to custom free-text mode and allows typing', async () => {
    const onChange = vi.fn();
    render(
      <ScheduleBuilder
        value="T2 - T4 - T6 (18:00 - 20:00)"
        onChange={onChange}
        isVi={true}
      />
    );

    const toggleModeBtn = screen.getByRole('button', { name: 'Nhập tự do' });
    await userEvent.click(toggleModeBtn);

    const input = screen.getByPlaceholderText('Nhập thời khóa biểu tự do...');
    expect(input).toBeInTheDocument();

    await userEvent.clear(input);
    await userEvent.type(input, 'Lịch học linh hoạt cuối tuần');

    expect(onChange).toHaveBeenLastCalledWith('Lịch học linh hoạt cuối tuần');
  });

  it('renders bilingual English content when isVi is false', () => {
    const onChange = vi.fn();
    render(
      <ScheduleBuilder
        value="Mon - Wed - Fri (08:00 - 10:00)"
        onChange={onChange}
        isVi={false}
      />
    );

    // English day names
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Monday')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Sunday')).toBeInTheDocument();

    // English labels
    expect(screen.getByText('Class Schedule Configuration')).toBeInTheDocument();
    expect(screen.getByText('Free Text Mode')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mon - Wed - Fri' })).toBeInTheDocument();
    expect(screen.getByText('Morning')).toBeInTheDocument();
  });
});
