import { fork } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { root, loadConfig, loadLocalEnv } from './config/env.js';
import { QaseAdapter } from '../../common/support/qase-adapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadLocalEnv();
const args = process.argv.slice(2);
const checkOnly = args.includes('--check-only');
const watchMode = args.includes('--watch');
const syncQase = args.includes('--sync-qase');
const rolesArg = args.find(a => a.startsWith('--roles='))?.slice(8);
const selectedRoles = rolesArg ? rolesArg.split(',') : ['admin', 'teacher', 'student'];

const ROLE_CONFIGS = {
  admin: {
    name: 'Admin',
    script: path.join(__dirname, 'admin', 'run.js'),
    prefix: '\x1b[36m[ADMIN]\x1b[0m',
    color: '#0284c7'
  },
  teacher: {
    name: 'Teacher',
    script: path.join(__dirname, 'teacher', 'run.js'),
    prefix: '\x1b[33m[TEACHER]\x1b[0m',
    color: '#d97706'
  },
  student: {
    name: 'Student',
    script: path.join(__dirname, 'student', 'run.js'),
    prefix: '\x1b[35m[STUDENT]\x1b[0m',
    color: '#9333ea'
  }
};

async function main() {
  const startedAt = new Date().toISOString();
  console.log(`\n================================================================`);
  console.log(`  EnglishHub Parallel E2E Test Engine`);
  console.log(`  Roles: ${selectedRoles.join(', ')} | Mode: ${checkOnly ? 'CHECK-ONLY' : watchMode ? 'WATCH (UI)' : 'HEADLESS'}`);
  console.log(`  UI Integrity: 100% Visual Fidelity (Images & Animations Kept)`);
  console.log(`================================================================\n`);

  const forwardArgs = args.filter(a => !a.startsWith('--roles=') && a !== '--sync-qase');

  const startTime = Date.now();
  const workerPromises = selectedRoles.map(role => runWorker(role, forwardArgs));
  const results = await Promise.all(workerPromises);

  const durationMs = Date.now() - startTime;
  console.log(`\n================================================================`);
  console.log(`  All Parallel Workers Completed in ${(durationMs / 1000).toFixed(2)}s`);
  console.log(`================================================================`);

  if (checkOnly) {
    const totalCases = results.reduce((acc, r) => acc + (r.checkCount || 0), 0);
    console.log(`\n[SUCCESS] Check-only complete: verified ${totalCases} test cases across ${results.length} roles.`);
    process.exit(0);
  }

  // Aggregate results
  const summary = {
    startedAt,
    finishedAt: new Date().toISOString(),
    durationSeconds: Number((durationMs / 1000).toFixed(2)),
    roles: results.map(r => ({
      role: r.role,
      exitCode: r.exitCode,
      report: r.report
    })),
    totalPassed: 0,
    totalFailed: 0,
    totalBlocked: 0,
    totalAborted: 0
  };

  for (const r of results) {
    if (r.report?.cases) {
      for (const c of r.report.cases) {
        if (c.status === 'PASSED') summary.totalPassed++;
        else if (c.status === 'FAILED') summary.totalFailed++;
        else if (c.status === 'BLOCKED') summary.totalBlocked++;
        else summary.totalAborted++;
      }
    }
  }

  // Write reports
  const reportsDir = path.join(root, 'reports');
  await fs.mkdir(reportsDir, { recursive: true });
  await fs.writeFile(path.join(reportsDir, 'parallel-summary.json'), JSON.stringify(summary, null, 2));
  await writeHtmlSummary(path.join(reportsDir, 'parallel-summary.html'), summary);

  console.log(`Summary JSON: ${path.join(reportsDir, 'parallel-summary.json')}`);
  console.log(`Summary HTML: ${path.join(reportsDir, 'parallel-summary.html')}`);

  // Automatically record any failed tests as structured bugs in test_reborn/bugs/active/
  await recordBugs(summary);

  // Sync to Qase TMS if requested
  if (syncQase) {
    await syncResultsToQase(summary);
  }

  const hasFailures = results.some(r => r.exitCode !== 0);
  process.exit(hasFailures ? 1 : 0);
}

function runWorker(role, workerArgs) {
  return new Promise((resolve) => {
    const conf = ROLE_CONFIGS[role];
    if (!conf) {
      console.error(`Unknown role: ${role}`);
      return resolve({ role, exitCode: 1 });
    }

    let reportData = null;
    let checkCount = 0;

    const child = fork(conf.script, workerArgs, {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      env: { ...process.env }
    });

    child.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (line.trim()) console.log(`${conf.prefix} ${line}`);
      }
    });

    child.stderr.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (line.trim()) console.error(`${conf.prefix} \x1b[31m${line}\x1b[0m`);
      }
    });

    child.on('message', (msg) => {
      if (msg?.type === 'result') reportData = msg.report;
      if (msg?.type === 'check') checkCount = msg.count || 0;
    });

    child.on('close', (code) => {
      resolve({
        role,
        exitCode: code ?? 0,
        report: reportData,
        checkCount
      });
    });
  });
}

async function writeHtmlSummary(filePath, summary) {
  const roleRows = summary.roles.map(r => {
    const counts = r.report?.cases?.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, { PASSED: 0, FAILED: 0, BLOCKED: 0 }) || { PASSED: 0, FAILED: 0, BLOCKED: 0 };
    return `
      <tr>
        <td style="font-weight: bold; text-transform: capitalize;">${r.role}</td>
        <td><span style="color: ${r.exitCode === 0 ? '#16a34a' : '#dc2626'}">${r.exitCode === 0 ? 'SUCCESS' : 'FAILED'}</span></td>
        <td style="color: #16a34a; font-weight: bold;">${counts.PASSED}</td>
        <td style="color: #dc2626; font-weight: bold;">${counts.FAILED}</td>
        <td style="color: #ca8a04; font-weight: bold;">${counts.BLOCKED}</td>
      </tr>
    `;
  }).join('');

  const html = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>Parallel E2E Test Execution Summary</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 40px; background: #f8fafc; color: #0f172a; line-height: 1.6; }
    .card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 900px; margin: 0 auto; }
    h1 { color: #1e293b; margin-top: 0; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-weight: bold; font-size: 14px; }
    .badge-success { background: #dcfce7; color: #15803d; }
    .badge-failed { background: #fee2e2; color: #b91c1c; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f1f5f9; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🚀 EnglishHub Parallel E2E Execution Summary</h1>
    <p><b>Thời gian thực thi:</b> ${summary.startedAt} (${summary.durationSeconds}s)</p>
    <p><b>Tiêu chuẩn NFR:</b> Usability USA-01..06 & Maintainability MAI-01..06 (100% hình ảnh & hiệu ứng)</p>
    <table>
      <thead>
        <tr>
          <th>Vai trò</th>
          <th>Trạng thái</th>
          <th>Pass</th>
          <th>Fail</th>
          <th>Blocked</th>
        </tr>
      </thead>
      <tbody>
        ${roleRows}
      </tbody>
    </table>
    <h3 style="margin-top: 24px;">Tổng quan: ${summary.totalPassed} Passed · ${summary.totalFailed} Failed · ${summary.totalBlocked} Blocked</h3>
  </div>
</body>
</html>`;

  await fs.writeFile(filePath, html, 'utf8');
}

async function syncResultsToQase(summary) {
  console.log(`\n[Qase Sync] Initializing Qase Adapter...`);
  const qase = new QaseAdapter({ enabled: true });
  if (!qase.enabled) {
    console.log(`[Qase Sync] Qase is disabled or missing QASE_API_TOKEN. Skipping live sync.`);
    return;
  }

  const runId = await qase.startRun(
    `Parallel E2E Run - Full Visual & UI Integrity`,
    `Concurrent execution of Admin, Teacher, and Student suites (${summary.durationSeconds}s duration)`
  );

  if (!runId) return;

  let syncedCount = 0;
  let skippedCount = 0;

  for (const r of summary.roles) {
    if (!r.report?.cases) continue;
    for (const c of r.report.cases) {
      const statusMap = {
        PASSED: 'passed',
        FAILED: 'failed',
        BLOCKED: 'blocked',
        ABORTED: 'skipped'
      };
      const res = await qase.recordResult(c.id, statusMap[c.status] || 'failed', {
        timeMs: 1000,
        comment: `[${r.role.toUpperCase()}] ${c.title}`,
        stackTrace: c.reason || ''
      });
      if (res?.status) syncedCount++;
      else skippedCount++;
    }
  }

  await qase.completeRun(runId);
  console.log(`[Qase Sync] Completed push to Qase TMS Run #${runId}! (${syncedCount} synced, ${skippedCount} skipped/unmapped)`);
}

async function recordBugs(summary) {
  const bugsDir = path.join(root, 'bugs', 'active');
  let bugCount = 0;
  for (const r of summary.roles) {
    if (!r.report?.cases) continue;
    for (const c of r.report.cases) {
      if (c.status === 'FAILED') {
        bugCount++;
        const slug = (c.title || 'unnamed').toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .slice(0, 40)
          .replace(/^-|-$/g, '');
        const bugFolder = path.join(bugsDir, `BUG-${c.id}-${slug}`);
        const evidenceDir = path.join(bugFolder, 'evidence');
        await fs.mkdir(evidenceDir, { recursive: true });

        // Copy screenshot if present
        if (c.screenshot && r.report.directory) {
          const srcScreenshot = path.join(r.report.directory, c.screenshot);
          const destScreenshot = path.join(evidenceDir, 'screenshot-error.png');
          await fs.copyFile(srcScreenshot, destScreenshot).catch(() => {});
        }

        // Copy dom if present
        if (c.dom && r.report.directory) {
          const srcDom = path.join(r.report.directory, c.dom);
          const destDom = path.join(evidenceDir, 'page-dom.html');
          await fs.copyFile(srcDom, destDom).catch(() => {});
        }

        // Write evidence details
        await fs.writeFile(path.join(evidenceDir, 'error-details.json'), JSON.stringify({
          caseId: c.id,
          title: c.title,
          role: r.role,
          phase: c.phase,
          classification: c.classification,
          reason: c.reason,
          actualUrl: c.actualUrl,
          httpError: c.httpError,
          startedAt: c.startedAt,
          finishedAt: c.finishedAt
        }, null, 2));

        // Write BUG REPORT README
        const content = `# [BUG REPORT] [${c.id}] ${c.title}

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-${c.id}
- **Tiêu đề**: ${c.title}
- **Phân hệ / Vai trò**: ${r.role.toUpperCase()}
- **Giai đoạn phát hiện (Phase)**: ${c.phase || 'scenario'}
- **Phân loại lỗi**: ${c.classification || 'PRODUCT_CANDIDATE'}
- **Trạng thái**: OPEN
- **Môi trường**: ${r.report?.baseUrl || 'Staging'}
- **Trình duyệt**: ${r.report?.browser || 'Chrome'} (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: ${c.startedAt || new Date().toISOString()}

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
${c.steps || 'Thực thi kịch bản kiểm thử tự động.'}

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  ${c.expected || 'Thực hiện thao tác thành công theo đặc tả SRS.'}

- **Thực tế (Actual Result)**:
  \`\`\`text
  ${c.reason || 'Assertion failed hoặc timeout.'}
  \`\`\`
- **URL tại thời điểm lỗi**: \`${c.actualUrl || 'N/A'}\`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)
${c.dom ? '- **DOM Snapshot HTML**: [evidence/page-dom.html](evidence/page-dom.html)\n' : ''}
`;
        await fs.writeFile(path.join(bugFolder, 'README.md'), content, 'utf8');
        console.log(`[BUG LOGGED] Created bug report at test_reborn/bugs/active/BUG-${c.id}-${slug}`);
      }
    }
  }
  if (bugCount > 0) {
    console.log(`\n[BUG CENTER] Successfully recorded ${bugCount} bug reports with full evidence into test_reborn/bugs/active/!`);
  }
}

main().catch(err => {
  console.error('Fatal Parallel Engine Error:', err);
  process.exit(1);
});
