import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { ConfirmModal, type ConfirmModalProps } from '../../components/common/ConfirmModal';

function renderModal(overrides: Partial<ConfirmModalProps> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ConfirmModal
      isOpen
      title="Xác nhận thao tác"
      message="Bạn có muốn tiếp tục?"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    />
  );
  return { onConfirm, onCancel };
}

it('keeps the message-only caller and default confirm behavior', async () => {
  const user = userEvent.setup();
  const { onConfirm, onCancel } = renderModal();

  expect(screen.getByText('Bạn có muốn tiếp tục?')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Xác nhận' }));

  expect(onConfirm).toHaveBeenCalledTimes(1);
  expect(onCancel).not.toHaveBeenCalled();
});

it.each(['cancel', 'close', 'Escape', 'backdrop'])('keeps the legacy %s dismissal', async action => {
  const user = userEvent.setup();
  const { onConfirm, onCancel } = renderModal();

  if (action === 'cancel' || action === 'close') {
    await user.click(screen.getByRole('button', { name: action === 'cancel' ? 'Hủy bỏ' : 'Đóng' }));
  } else if (action === 'Escape') {
    await user.keyboard('{Escape}');
  } else {
    await user.click(screen.getByRole('dialog'));
  }

  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(onConfirm).not.toHaveBeenCalled();
});

it('renders children after the message and before the footer controls', () => {
  renderModal({ children: <label>Hạn nộp <input type="datetime-local" /></label> });

  const field = screen.getByLabelText('Hạn nộp');
  const message = screen.getByText('Bạn có muốn tiếp tục?');
  const confirm = screen.getByRole('button', { name: 'Xác nhận' });
  expect(field).toBeVisible();
  expect(message.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(field.compareDocumentPosition(confirm) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

it('disables only confirm when confirmDisabled is true', async () => {
  const user = userEvent.setup();
  const { onConfirm, onCancel } = renderModal({ confirmDisabled: true });
  const confirm = screen.getByRole('button', { name: 'Xác nhận' });
  const cancel = screen.getByRole('button', { name: 'Hủy bỏ' });

  expect(confirm).toBeDisabled();
  expect(cancel).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Đóng' })).toBeEnabled();
  await user.click(confirm);
  await user.click(cancel);

  expect(onConfirm).not.toHaveBeenCalled();
  expect(onCancel).toHaveBeenCalledTimes(1);
});

it('uses closeLabel for the close button without changing the cancel label', async () => {
  const user = userEvent.setup();
  const { onCancel } = renderModal({ closeLabel: 'Close dialog' });

  expect(screen.getByRole('button', { name: 'Hủy bỏ' })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Close dialog' }));
  expect(onCancel).toHaveBeenCalledTimes(1);
});

it('blocks confirm, cancel, close, Escape and backdrop while loading', () => {
  const { onConfirm, onCancel } = renderModal({ isLoading: true });
  const confirm = screen.getByRole('button', { name: 'Xác nhận' });
  const cancel = screen.getByRole('button', { name: 'Hủy bỏ' });
  const close = screen.getByRole('button', { name: 'Đóng' });

  for (const button of [confirm, cancel, close]) {
    expect(button).toBeDisabled();
    fireEvent.click(button);
  }
  fireEvent.keyDown(window, { key: 'Escape' });
  fireEvent.click(screen.getByRole('dialog'));

  expect(onConfirm).not.toHaveBeenCalled();
  expect(onCancel).not.toHaveBeenCalled();
});

it('links each dialog to its own title with a unique id', () => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <>
      <ConfirmModal isOpen title="First" message="One" onConfirm={onConfirm} onCancel={onCancel} />
      <ConfirmModal isOpen title="Second" message="Two" onConfirm={onConfirm} onCancel={onCancel} />
    </>
  );
  const first = screen.getByRole('dialog', { name: 'First' });
  const second = screen.getByRole('dialog', { name: 'Second' });
  const firstTitle = within(first).getByRole('heading', { name: 'First' });
  const secondTitle = within(second).getByRole('heading', { name: 'Second' });

  expect(firstTitle.id).not.toBe(secondTitle.id);
  expect(first).toHaveAttribute('aria-labelledby', firstTitle.id);
  expect(second).toHaveAttribute('aria-labelledby', secondTitle.id);
});

it('removes the dialog and its Escape handler when closed', () => {
  const props = { title: 'Confirm', message: 'Continue?', onConfirm: vi.fn(), onCancel: vi.fn() };
  const { rerender } = render(<ConfirmModal {...props} isOpen />);
  rerender(<ConfirmModal {...props} isOpen={false} />);

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(props.onCancel).not.toHaveBeenCalled();
});

it('keeps Tab inside an opted-in dialog even while pending and restores the trigger focus', async () => {
  const user = userEvent.setup();
  const view = (isOpen: boolean, isLoading = false) => (
    <>
      <button type="button">Mở bài tập</button>
      <button type="button">Điều khiển bên ngoài</button>
      <ConfirmModal
        isOpen={isOpen}
        isLoading={isLoading}
        trapFocus
        title="Xác nhận"
        message="Tiếp tục?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    </>
  );
  const { rerender } = render(view(false));
  const trigger = screen.getByRole('button', { name: 'Mở bài tập' });
  trigger.focus();
  rerender(view(true));
  expect(screen.getByRole('button', { name: 'Đóng' })).toHaveFocus();
  await user.tab({ shift: true });
  expect(screen.getByRole('button', { name: 'Xác nhận' })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole('button', { name: 'Đóng' })).toHaveFocus();

  rerender(view(true, true));
  await user.tab();
  expect(screen.getByRole('dialog')).toHaveFocus();

  rerender(view(false));
  expect(trigger).toHaveFocus();
  await user.tab();
  expect(screen.getByRole('button', { name: 'Điều khiển bên ngoài' })).toHaveFocus();
});
