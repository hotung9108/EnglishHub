import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { viewerStyle, viewerMarkup } from "./report-viewer.js";

export class Blocked extends Error { constructor(message) { super(message); this.name = 'Blocked'; } }
export function redact(value, secrets = []) {
  if (typeof value === 'string') {
    for (const secret of secrets.filter(Boolean).sort((a, b) => b.length - a.length)) value = value.replaceAll(secret, '[REDACTED]');
    return value.replace(/Bearer\s+[\w.-]+/gi, 'Bearer [REDACTED]');
  }
  if (Array.isArray(value)) return value.map(item => redact(item, secrets));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) =>
    [key, /password|token|authorization|cookie|uploadUrl|downloadUrl/i.test(key) ? '[REDACTED]' : redact(item, secrets)]));
  return value;
}
export const classify = (error, phase) => error instanceof Blocked || phase === 'Setup' ? 'BLOCKED' : 'FAILED';
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export async function report(output, run) {
  const counts = Object.fromEntries(['PASSED', 'FAILED', 'BLOCKED', 'SKIPPED'].map(s => [s, run.results.filter(r => r.status === s).length]));
  const body = { ...run, counts, executed: run.results.length, complete: run.results.length === run.total };
  await writeFile(join(output, 'summary.json'), JSON.stringify(body, null, 2));
  const details = run.results.map(r => `<details data-case-id="${escape(r.id)}"><summary class="${r.status}">${escape(r.id)} — ${r.status} — ${escape(r.title)} (${r.durationMs} ms)</summary>
    <p>${escape(r.requirement)} · Excel row ${r.row}</p>
    <p>Thực thi: ${escape(r.startedAt || 'Chưa chạy')} · Nguồn: ${escape(r.sourceRun || run.runId)} · Code: ${escape((r.sourceProcedureSha256 || run.procedureSha256 || '').slice(0, 12))}</p>
    ${run.outdatedCaseIds?.includes(r.id)?'<p class="BLOCKED"><strong>Kết quả lịch sử: bộ chạy đã thay đổi sau lần thực thi này. Cần chạy lại ca trước khi kết luận theo code hiện tại.</strong></p>':''}
    ${(run.currentScopeExclusions?.find(t => t.id === r.id) || r.scopeExclusion) ? `<p class="SKIPPED">Phạm vi đã chốt: ${escape((run.currentScopeExclusions?.find(t => t.id === r.id) || r.scopeExclusion).reason)} Kết quả lịch sử (nếu có) vẫn được giữ nguyên.</p>` : ''}
    <b>Precondition</b><pre>${escape(r.precondition)}</pre>
    <b>Test data (reference / actual)</b><pre>${escape(r.testData)}\n${escape(JSON.stringify(r.actualData, null, 2))}</pre>
    <b>Excel steps</b><pre>${escape(r.steps)}</pre><b>Expected</b><pre>${escape(r.expected)}</pre>
    <b>Actual / reason</b><pre>${escape(r.reason || 'All implemented assertions completed.')}</pre>
    <b>Execution log</b><pre>${escape(JSON.stringify(r.log, null, 2))}</pre>
    ${(r.screenshots || []).map(s => `<a class="evidence-image" href="${escape(s)}" aria-label="Xem ảnh ${escape(r.id)}"><img loading="lazy" src="${escape(s)}" alt="${escape(r.id)} evidence"></a>`).join('')}
    ${(r.evidence || []).map(e => `<p><a target="_blank" rel="noopener" href="${escape(e)}">${escape(e)}</a></p>`).join('')}</details>`).join('\n');
  await writeFile(join(output, 'index.html'), `<!doctype html><html lang="vi"><meta charset="utf-8"><title>EnglishHub Selenium SRS</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>body{font:15px system-ui;margin:32px;max-width:1300px;background:#f5f7fa;color:#132238}details{background:white;padding:16px;margin:12px 0;border-radius:8px}summary{cursor:pointer;font-weight:bold}.FAILED{color:#b91c1c}.PASSED{color:#047857}.BLOCKED,.SKIPPED{color:#92400e}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px}img{max-width:600px;width:100%;margin:8px;border:1px solid #ccc}${viewerStyle}</style>
    <h1>EnglishHub — Selenium / SRS</h1><p>Run ${escape(run.runId)} · ${escape(run.baseUrl)} · ${run.results.length}/${run.total}</p>
    <p>${Object.entries(counts).map(([s, n]) => `<strong class="${s}">${s}: ${n}</strong>`).join(' · ')}</p>
    ${run.outdatedCaseIds?.length?`<p class="BLOCKED"><strong>${run.outdatedCaseIds.length} ca có kết quả từ phiên bản code khác.</strong> Trạng thái bên dưới giữ nguyên lịch sử, chưa xác minh theo bộ chạy hiện tại.</p>`:''}
    <p>Run status: ${escape(run.status||'RUNNING')} · Cleanup errors: ${run.cleanupErrors?.length??'pending'} · Archived fixture classes retained by API: ${run.retainedFixtures?.length??0}. <a href="cleanup.json">Cleanup details</a> · <a href="fixture-journal.json">Fixture journal</a></p>
    <p>FAILED: assertion or execution mismatch, requires triage. BLOCKED: prerequisite/spec/evidence unavailable. SKIPPED: excluded or not implemented. No failure is converted into a pass.</p>
    <p>Bấm ảnh để xem ngay tại đây; Esc để đóng, ← → để chuyển ảnh trong ca, bấm ảnh lớn để phóng to. Log và ảnh gốc mở ở tab riêng.</p>${details}${viewerMarkup}</html>`);
  return body;
}

export async function executeCase(test, scenario, env) {
  const start = performance.now();
  const result = { ...test, startedAt: new Date().toISOString(), log: [], screenshots: [], evidence: [] };
  const dir = join(env.output, test.id);
  await mkdir(dir, { recursive: true });
  let driver, phase = 'Setup', imageIndex = 0;
  const cleanups = [];
  const secrets = env.secrets || [];
  const apiStart = env.pool?.events.length || 0;
  const safeError = error => redact(`${error.name}: ${error.message}`, secrets);
  const persist = () => writeFile(join(dir, 'execution.json'), JSON.stringify(redact(result, secrets), null, 2));
  const evidence = async (label, data) => {
    const name = `${label.replace(/[^a-z0-9_-]/gi, '_')}.json`;
    await writeFile(join(dir, name), JSON.stringify(redact(data, secrets), null, 2));
    result.evidence.push(`${test.id}/${name}`);
  };
  const screenshot = async label => {
    if (!driver) return;
    const name = `${String(++imageIndex).padStart(3, '0')}-${label.replace(/[^a-z0-9_-]/gi, '_')}.png`;
    // Hide secrets in UI evidence without changing application input/state.
    await driver.executeScript(`document.querySelectorAll('input[type=password],input[autocomplete=current-password],input[autocomplete=new-password]').forEach(e=>e.style.webkitTextSecurity='disc')`);
    await writeFile(join(dir, name), await driver.takeScreenshot(), 'base64');
    result.screenshots.push(`${test.id}/${name}`);
  };
  const step = async (description, action) => {
    const entry = { phase, description, at: new Date().toISOString() };
    const t = performance.now(); result.log.push(entry);
    try { const value = await action(); entry.status = 'PASSED'; return value; }
    catch (error) { entry.status = classify(error, phase); entry.error = safeError(error); entry.stack=redact(error.stack,secrets); throw error; }
    finally {
      entry.durationMs = Math.round(performance.now() - t);
      if (phase === 'Execution') {
        try { await screenshot(entry.status === 'PASSED' ? 'step' : 'failure'); }
        catch (error) { result.evidenceErrors ??= []; result.evidenceErrors.push(safeError(error)); }
      }
      await persist();
    }
  };
  try {
    if (test.scopeExclusion) {
      result.status = 'SKIPPED'; result.reason = test.scopeExclusion.reason;
      result.log.push({ phase: 'Scope', description: result.reason, status: 'SKIPPED', startedAt: new Date().toISOString(), durationMs: 0 });
      return result;
    }
    if (!scenario) { result.status = 'SKIPPED'; result.reason = 'No reviewed Selenium procedure implemented'; return result; }
    if(/giả định|cần xác nhận/i.test(test.expected||'')){
      result.log.push({phase:'Requirement review',description:'Expected result still contains an unconfirmed assumption; acceptance PASS is not permitted',status:'BLOCKED'});
      throw new Blocked('Expected result còn ghi giả định/cần xác nhận; chưa được phép dùng hành vi hiện tại làm PASS nghiệm thu. Cần nguồn yêu cầu đã được duyệt.');
    }
    driver = await step('Start isolated WebDriver session', () => env.buildDriver(test));
    const ctx = { ...env, driver, step, evidence, screenshot, result, test, registerCleanup: (description, action) => cleanups.push({ description, action }) };
    const fixture = await step('Prepare prerequisites and isolated fixture', () => scenario.prepare?.(ctx.registerCleanup, ctx));
    result.actualData = redact(fixture?.publicData || fixture || scenario.data || {}, secrets);
    phase = 'Execution';
    await scenario.run(ctx, fixture);
    assert.ok(result.log.some(e => e.phase === 'Execution'), 'Scenario must record executed steps');
    result.status = 'PASSED';
  } catch (error) { result.status = classify(error, phase); result.reason = safeError(error);
    result.failureType=result.status==='BLOCKED'?'PREREQUISITE_OR_ORACLE':error.code==='ERR_ASSERTION'?'ASSERTION_MISMATCH':/Timeout|NoSuchElement/.test(error.name)?'UI_WAIT_MISMATCH':'AUTOMATION_OR_RUNTIME_ERROR';
  }
  finally {
    if(driver)try{const observation=await driver.executeScript('return {requests:window.__srsNetwork||[],loading:window.__srsUiStates||[],errors:window.__srsErrors||[],url:location.href,controls:Array.from(document.querySelectorAll("main button,main a,main input,main select,main textarea,[role=dialog] button"),e=>({tag:e.tagName,text:e.innerText?.trim(),type:e.type,placeholder:e.placeholder,title:e.title,ariaLabel:e.getAttribute("aria-label"),className:e.className,href:e.getAttribute("href")}))}');await evidence('browser-network-and-loading',observation);}catch(error){result.observationError=safeError(error);}
    try { await screenshot('final'); } catch (error) { result.evidenceErrors ??= []; result.evidenceErrors.push(safeError(error)); }
    phase = 'Cleanup';
    for (const task of cleanups.reverse()) {
      try { await step(task.description, task.action); }
      catch (error) { result.cleanupFailed = true; if (result.status === 'PASSED') { result.status = 'BLOCKED'; result.reason = 'Cleanup failed; inspect execution log and fixture journal'; } }
    }
    if (driver) try { await step('Close WebDriver session', () => driver.quit()); } catch { result.cleanupFailed = true; }
    if (result.status === 'PASSED' && (result.evidenceErrors?.length || !result.screenshots.length || result.cleanupFailed)) {
      result.status = 'BLOCKED'; result.reason = 'Mandatory screenshot/cleanup could not be verified';
    }
    result.durationMs = Math.round(performance.now() - start);
    result.finishedAt = new Date().toISOString();
    if (env.pool?.events.length > apiStart) await evidence('api-responses', env.pool.events.slice(apiStart));
    await persist();
  }
  return result;
}
