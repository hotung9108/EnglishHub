import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import React from 'react';
import { ToastProvider, useToast } from '../../components/common/ToastContext';

let lastToastId = '';

const TestToastConsumer: React.FC = () => {
  const { showToast, removeToast, clearAll, success, error, warning, info } = useToast();

  return (
    <div>
      <button onClick={() => showToast({ type: 'info', message: 'Info message', duration: 1000 })}>
        Show Info
      </button>
      <button onClick={() => success('Success message', 'Success Title', 2000)}>
        Show Success
      </button>
      <button onClick={() => error('Error message', 'Error Title', 0)}>
        Show Sticky Error
      </button>
      <button onClick={() => warning('Warning message')}>
        Show Warning
      </button>
      <button onClick={() => info('Test info')}>
        Show Default Info
      </button>
      <button onClick={() => clearAll()}>
        Clear All
      </button>
      <button
        onClick={() => {
          lastToastId = showToast({ type: 'info', message: 'Manual remove', duration: 5000 });
        }}
      >
        Show For Manual Remove
      </button>
      <button
        onClick={() => {
          if (lastToastId) removeToast(lastToastId);
        }}
      >
        Remove Manual Toast
      </button>
    </div>
  );
};

describe('ToastContext [Lifecycle & Timer Stability]', () => {
  beforeEach(() => {
    lastToastId = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('renders and automatically removes toasts after specified duration', () => {
    render(
      <ToastProvider>
        <TestToastConsumer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));
    expect(screen.getByText('Info message')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByText('Info message')).not.toBeInTheDocument();
  });

  it('supports success helper with title and custom duration', () => {
    render(
      <ToastProvider>
        <TestToastConsumer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Success'));
    expect(screen.getByText('Success Title')).toBeInTheDocument();
    expect(screen.getByText('Success message')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByText('Success message')).not.toBeInTheDocument();
  });

  it('does not auto-remove toast when duration is 0 (sticky toast)', () => {
    render(
      <ToastProvider>
        <TestToastConsumer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Sticky Error'));
    expect(screen.getByText('Error message')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('manually removes toast and clears active timer', () => {
    render(
      <ToastProvider>
        <TestToastConsumer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show For Manual Remove'));
    expect(screen.getByText('Manual remove')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Remove Manual Toast'));
    expect(screen.queryByText('Manual remove')).not.toBeInTheDocument();

    // Advancing timer should not throw or cause unexpected behaviour
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(screen.queryByText('Manual remove')).not.toBeInTheDocument();
  });

  it('clears all toasts and timers when clearAll is called', () => {
    render(
      <ToastProvider>
        <TestToastConsumer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));
    fireEvent.click(screen.getByText('Show Success'));
    expect(screen.getByText('Info message')).toBeInTheDocument();
    expect(screen.getByText('Success message')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Clear All'));
    expect(screen.queryByText('Info message')).not.toBeInTheDocument();
    expect(screen.queryByText('Success message')).not.toBeInTheDocument();
  });

  it('cleans up all pending timers when ToastProvider unmounts without throwing window is not defined', () => {
    const { unmount } = render(
      <ToastProvider>
        <TestToastConsumer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));
    fireEvent.click(screen.getByText('Show Success'));

    // Unmount while timers are active
    unmount();

    // Advancing timers after unmount must NOT throw ReferenceError: window is not defined
    expect(() => {
      act(() => {
        vi.advanceTimersByTime(5000);
      });
    }).not.toThrow();
  });
});
