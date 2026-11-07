// Triage hints, never a claim that a product bug has been confirmed.
export function classifyFailure(error, phase) {
  if (error.code === 'QA29_BLOCKED') return 'BLOCKED';
  if (error.code === 'QA29_DATA_TIMEOUT') return 'DATA_LOAD_REVIEW';
  if (error.code === 'QA29_PRODUCT_CANDIDATE') return 'PRODUCT_CANDIDATE';
  if (error.code === 'QA29_CLEANUP') return 'HARNESS_REVIEW';
  if (error.status === 401) return 'API_AUTH_REVIEW';
  if (error.status === 403 || error.status === 404) return 'API_ACCESS_REVIEW';
  if (/Transport error|curl unavailable|tab crashed|session not created|ERR_|disconnected/i.test(error.message)) return 'ENVIRONMENT_REVIEW';
  if (phase === 'driver' || phase === 'cleanup') return 'HARNESS_REVIEW';
  return 'NEEDS_REVIEW';
}
