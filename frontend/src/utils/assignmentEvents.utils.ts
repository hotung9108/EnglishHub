export const ASSIGNMENT_SUBMITTED_EVENT = 'englishhub:assignment-submitted';

export function notifyAssignmentSubmitted(): void {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent(ASSIGNMENT_SUBMITTED_EVENT));
  }
}
