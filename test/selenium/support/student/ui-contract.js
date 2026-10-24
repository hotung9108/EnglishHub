import assert from 'node:assert/strict';

export const normalizeLabel = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/\s+/g, ' ').trim().toLowerCase();
export const historyAttemptNumber = value => Number(normalizeLabel(value).match(/^lan\s+(\d+)/)?.[1] ?? NaN);
export function verifyExhaustedActions(actions) {
  for (const action of actions.filter(a => a.visible && a.enabled)) {
    const label = normalizeLabel(action.label);
    assert.doesNotMatch(label, /bat dau|lam lai|tiep tuc|start|retake|continue/, 'Exhausted assignment offers an enabled start/resume action');
    if (!/xem.*(ket qua|bai nop|bai lam)|view.*(result|submission)|review/.test(label)) {
      throw Object.assign(new Error(`Review unknown enabled Overview action after exhaustion: ${action.label}`), { code: 'QA30_UI_CONTRACT' });
    }
  }
}

// Both deployed Overview layouts are supported; numbers still come from the API.
export function parseAttemptRule(value) {
  const text = normalizeLabel(value);
  const compact = text.match(/(\d+)\s*\/\s*(\d+)\s*lan/);
  if (compact) return { used: Number(compact[1]), maximum: Number(compact[2]), remaining: text.match(/con\s+(\d+)\s+luot/)?.[1] === undefined ? undefined : Number(text.match(/con\s+(\d+)\s+luot/)[1]) };
  const full = text.match(/toi da\s+(\d+)\s+lan.*da nop\s+(\d+)\s*\/\s*(\d+)/);
  if (full) {
    assert.equal(Number(full[1]), Number(full[3]), 'Overview contains conflicting attempt limits');
    return { used: Number(full[2]), maximum: Number(full[1]) };
  }
  if (text.includes('khong gioi han')) return { maximum: null, used: Number(text.match(/da lam\s+(\d+)/)?.[1] ?? NaN) };
  throw Object.assign(new Error(`Unrecognised Overview attempt display: ${value}`), { code: 'QA30_UI_CONTRACT' });
}

export function verifyAttemptRule(value, maximum, attempts) {
  const actual = parseAttemptRule(value);
  assert.equal(actual.maximum, maximum, `Overview attempt limit differs from API: UI=${actual.maximum}, API=${maximum}; display="${value}"`);
  const completed = attempts.filter(a => a.status !== 'IN_PROGRESS').length;
  assert.equal(actual.used, completed, 'Overview attempt count differs from API');
  if (actual.remaining !== undefined && maximum !== null) {
    const completed = attempts.filter(a => a.status !== 'IN_PROGRESS').length;
    assert.equal(actual.remaining, Math.max(0, maximum - completed), 'Overview remaining attempts differ from API');
  }
  return actual;
}
