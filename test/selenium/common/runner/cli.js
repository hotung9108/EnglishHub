import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import edge from 'selenium-webdriver/edge.js';
import "../../config/runtime.js";
import { executeCase, report, redact } from "./core.js";
import { FixturePool } from "../fixtures/pool.js";
import { observerScript } from "./browser-observer.js";
import { procedureFingerprint } from "./provenance.js";
import { buildReportIndex } from './report-catalog.js';

const args = process.argv.slice(2);
if(args.includes('--check-only')&&!args.includes('--list'))args.push('--list');
for(const arg of args.filter(a=>a.startsWith('--')))assert.ok(['--list','--check-only','--no-fixtures'].includes(arg)||/^--role=(admin|teacher|student)$/.test(arg),`Unsupported option ${arg}; use --list to inspect without staging writes`);
const workbook = args.find(x => !x.startsWith('--') && /\.xlsx$/i.test(x));
const selection = args.filter(x => x !== workbook && !x.startsWith('--'));
const reader = fileURLToPath(new URL("../../catalog/read-cases.py", import.meta.url));
const catalog=JSON.parse(await readFile(new URL("../../catalog/cases.json",import.meta.url),'utf8'));
const cases=workbook?JSON.parse(execFileSync(process.env.SELENIUM_PYTHON || 'python',[reader,workbook],{encoding:'utf8'})):structuredClone(catalog.cases);
if(workbook){const workbookHash=createHash('sha256').update(await readFile(workbook)).digest('hex');assert.equal(workbookHash,catalog.sources.workbook.sha256,'Workbook changed since procedure review; review mapping before rebuilding catalog');}
for(const test of cases){const entry=catalog.cases.find(c=>c.id===test.id);test.sourceReferences=entry?.sourceReferences;test.pendingOracleOrFixture=entry?.pendingOracleOrFixture;if(entry?.requirementClarification){test.expected=entry.expected;test.originalExpected=entry.originalExpected;test.requirementClarification=entry.requirementClarification;}}
for (const id of selection) assert.ok(cases.some(t => t.id === id), `Unknown case ID: ${id}`);
const roleFilter=args.find(a=>a.startsWith('--role='))?.split('=')[1];
if(roleFilter)assert.ok(['admin','teacher','student'].includes(roleFilter),'Unknown role');
const normalizeRole=r=>['empty','outsider','other'].includes(r)?'student':r;
const selected = cases.filter(t=>(!selection.length||selection.includes(t.id))&&(!roleFilter||normalizeRole(scenarios[t.id]?.data?.role)===roleFilter));
assert.ok(selected.length,'No cases selected');
for (const test of cases) test.scopeExclusion = catalog.cases.find(c => c.id === test.id)?.scopeExclusion;
import {scenarios,caseFiles} from "./registry.js";
if (args.includes('--list')) {
  console.log(JSON.stringify({ total: cases.length, selected:selected.length, active: cases.filter(t => !t.scopeExclusion).length, excluded: cases.filter(t => t.scopeExclusion).length, procedures: cases.filter(t => scenarios[t.id]).length, pendingOracleOrFixture:cases.filter(t=>t.pendingOracleOrFixture).length, cases: selected.map(t => ({ id: t.id, requirement: t.requirement, procedure: !!scenarios[t.id], scopeExclusion: t.scopeExclusion, pendingOracleOrFixture:t.pendingOracleOrFixture,sourceFile:caseFiles[t.id]||null })) }, null, 2));
} else {
  const baseUrl = (process.env.SELENIUM_BASE_URL || 'https://staging.hotung9108.me').replace(/\/$/, '');
  const apiBase = (process.env.SELENIUM_API_BASE_URL || 'https://api-staging.hotung9108.me/api/v1').replace(/\/$/, '');
  assert.equal(new URL(baseUrl).hostname, 'staging.hotung9108.me', 'Fixture suite restricted to authorized staging');
  assert.equal(new URL(apiBase).hostname, 'api-staging.hotung9108.me');
  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const reportsRoot=fileURLToPath(new URL("../../reports",import.meta.url));
  const output = process.env.SELENIUM_OUTPUT_DIR?resolve(process.env.SELENIUM_OUTPUT_DIR):join(reportsRoot,`srs-${runId}`);
  assert.ok(!relative(reportsRoot,output).startsWith('..')&&relative(reportsRoot,output),'Report directory must be a child of Selenium reports');await mkdir(output, { recursive: true });
  const temporary=join(output,'tmp');await mkdir(temporary);process.env.TEMP=temporary;process.env.TMP=temporary;process.env.TMPDIR=temporary;
  const secrets = Object.entries(process.env).filter(([k]) => /PASSWORD|TOKEN|SECRET/.test(k)).map(([, v]) => v);
  const pool = new FixturePool({ apiBase, admin: { email: process.env.SELENIUM_ADMIN_EMAIL, password: process.env.SELENIUM_ADMIN_PASSWORD }, output, secrets });
  const run = { runId, baseUrl, apiBase, total: selected.length, source: catalog.sources, results: [] };
  const fingerprint=await procedureFingerprint();
  run.procedureSha256=fingerprint.sha256;run.procedureFiles=fingerprint.files;
  let setupError;
  try { if (!args.includes('--no-fixtures') && selected.some(t => !t.scopeExclusion)) await pool.init(); }
  catch (e) { setupError = String(e.message); console.log('Fixture setup blocked:', redact(setupError, secrets)); }
  const buildDriver = async (test, browserOverride) => {
    const browser = browserOverride || process.env.SELENIUM_BROWSER || 'chrome';
    const options = browser === 'edge' ? new edge.Options() : new chrome.Options();
    options.addArguments('--window-size=1440,1000', '--use-fake-device-for-media-stream');
    if (test.id !== 'DO_008') options.addArguments('--use-fake-ui-for-media-stream');
    if (process.env.SELENIUM_HEADLESS !== 'false') options.addArguments('--headless=new');
    const builder = new Builder().forBrowser(browser === 'edge' ? 'MicrosoftEdge' : 'chrome');
    if (browser === 'edge') builder.setEdgeOptions(options); else builder.setChromeOptions(options);
    const driver = await builder.build(); await driver.manage().setTimeouts({ implicit: 0, pageLoad: 25000, script: 30000 });
    await driver.sendDevToolsCommand('Page.addScriptToEvaluateOnNewDocument',{source:observerScript});return driver;
  };
  await report(output, run);
  try {
    for (const test of selected) {
      let procedure = scenarios[test.id];
      if (setupError && procedure?.prepare) procedure = { ...procedure, prepare: () => { throw new Error(setupError); } };
      const result = await executeCase(test, procedure, { output, baseUrl, pool, secrets, setupError, buildDriver });
      run.results.push(redact(result, secrets)); await report(output, run);
      console.log(`${result.status} ${result.id} ${result.reason || ''}`);
    }
  } finally {
    run.cleanupErrors = await pool.cleanup(); run.retainedFixtures=pool.resources.filter(r=>r.state==='ARCHIVED');run.finishedAt = new Date().toISOString();
    run.cleanupDisposition={deleted:pool.resources.filter(r=>r.state==='DELETED').length,retained:run.retainedFixtures.length,remaining:pool.resources.filter(r=>!['DELETED','ARCHIVED'].includes(r.state)).length,allFixturesDeleted:pool.resources.every(r=>r.state==='DELETED'),status:run.cleanupErrors.length?'CLEANUP_ERRORS':run.retainedFixtures.length?'RETAINED_DATA_REQUIRES_FOLLOWUP':'ALL_DELETED',retentionPolicy:'ARCHIVED classes still exist. No automatic purge or database deletion is performed. The environment owner must approve a long-term retention/purge policy.'};
    assert.equal(relative(resolve(output),resolve(temporary)),'tmp','Only this run temporary browser directory may be removed');
    try{await rm(temporary,{recursive:true,force:true});}catch(error){run.temporaryCleanupError=error.message;}
    const unresolved = run.results.some(r => r.status !== 'PASSED' && !(r.status === 'SKIPPED' && r.scopeExclusion));
    run.status=run.cleanupErrors.length?'CLEANUP_FAILED':run.results.some(r=>r.status==='FAILED')?'FAILED':unresolved?'INCOMPLETE':'PASSED';
    const final = await report(output, run);
    await writeFile(join(output, 'run.log'), run.results.map(r => `${r.startedAt} ${r.status} ${r.id} ${r.durationMs}ms ${r.reason || ''}`).join('\n'));
    try{await buildReportIndex({root:reportsRoot,catalogPath:fileURLToPath(new URL('../../catalog/cases.json',import.meta.url))});}catch(error){console.warn('Report index could not be refreshed:',error.message);}
    console.log(output); console.log(JSON.stringify(final.counts));
    process.exitCode = run.cleanupErrors.length || unresolved ? 1 : 0;
  }
}
