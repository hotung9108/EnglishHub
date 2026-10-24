export function studentFailure(error, phase, interrupted = false) {
  if (interrupted) return { status: 'ABORTED', classification: 'INTERRUPTED', stopSuite: true };
  const lostBrowser = /invalid session id|no such session|chrome not reachable|not connected to DevTools|disconnected.*browser/i.test(error.message || '');
  const unavailable = error.status >= 500 || /Transport error|curl unavailable/i.test(error.message || '');
  if (phase === 'driver' || error.code === 'QA30_ENVIRONMENT' || ['ENOSPC', 'EACCES', 'EPERM'].includes(error.code) || lostBrowser || unavailable) {
    return { status: 'BLOCKED', classification: 'ENVIRONMENT_REVIEW', stopSuite: true };
  }
  if (error.code === 'QA30_PREREQUISITE') return { status: 'BLOCKED', classification: 'FIXTURE_REVIEW', stopSuite: false };
  if (error.code === 'QA30_PRODUCT_BLOCKED') return { status: 'BLOCKED', classification: 'PRODUCT_DEPENDENCY', stopSuite: false };
  const classification = error.code === 'QA30_UI_CONTRACT' ? 'UI_CONTRACT_REVIEW'
    : error.code === 'QA30_CONTRACT_GAP' ? 'CONTRACT_GAP_REVIEW'
      : error.code === 'ERR_ASSERTION' ? 'PRODUCT_CANDIDATE'
        : error.status === 403 ? 'API_ACCESS_REVIEW' : error.status === 401 ? 'API_AUTH_REVIEW' : 'NEEDS_REVIEW';
  return { status: 'FAILED', classification, stopSuite: false };
}
