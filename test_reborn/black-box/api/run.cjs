#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..', '..');
for (const envFile of [path.join(rootDir, '.env'), path.join(rootDir, 'common', 'config', '.env')]) {
  if (fs.existsSync(envFile)) {
    const lines = fs.readFileSync(envFile, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const k = trimmed.slice(0, eqIdx).trim();
        const v = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (process.env[k] === undefined) process.env[k] = v;
      }
    }
  }
}

const catalogPath = path.join(__dirname, 'catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const args = process.argv.slice(2);
const isList = args.includes('--list');
const isDryRun = args.includes('--dry-run');
const isSyncQase = args.includes('--sync-qase');
const isParallel = args.includes('--parallel');
const roleArg = args.find(a => a.startsWith('--role='))?.split('=')[1];
const suiteArg = args.find(a => a.startsWith('--suite='))?.split('=')[1];
const cliEnv = args.find(a => a.startsWith('--env='))?.split('=')[1]?.toLowerCase();

const targetEnv = (cliEnv || process.env.TEST_ENV || 'staging').toLowerCase() === 'local' ? 'local' : 'staging';
const apiBaseUrl = targetEnv === 'local'
  ? (process.env.LOCAL_API_URL || 'http://localhost:8080/api/v1')
  : (process.env.STAGING_API_URL || 'https://api-staging.hotung9108.me/api/v1');
const baseUrlOrigin = new URL(apiBaseUrl).origin;

const adminEmail = process.env.SELENIUM_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'hoang.thanh.ngan@utc-polyglot.edu.vn';
const adminPassword = process.env.SELENIUM_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'Password123!';
const teacherEmail = process.env.SELENIUM_TEACHER_EMAIL || process.env.TEACHER_EMAIL || 'pham.dieu.anh@gmail.com';
const studentEmail = process.env.SELENIUM_STUDENT_EMAIL || process.env.STUDENT_EMAIL || 'ngo.thi.phuong@gmail.com';

if (isList) {
  console.log('\n=== DANH MỤC API BLACK-BOX SUITES (EnglishHub) ===');
  console.log(`Source of Truth: ${catalog.sourceOfTruth}`);
  console.log(`Qase Project: ${catalog.qaseProjectCode}\n`);
  catalog.suites.forEach(s => {
    console.log(`[${s.id}] (${s.role.toUpperCase()}) - ${s.suiteName}`);
    console.log(`   Use Cases: ${s.useCases.join(', ')} | Qase Suite ID: ${s.qaseSuiteId}`);
    console.log(`   Collection: ${s.collection}`);
    console.log(`   Environment: ${s.environment}`);
    console.log(`   Mô tả: ${s.description}\n`);
  });
  process.exit(0);
}

let selectedSuites = catalog.suites;
if (roleArg && roleArg !== 'all') {
  selectedSuites = selectedSuites.filter(s => s.role.toLowerCase() === roleArg.toLowerCase());
}
if (suiteArg) {
  selectedSuites = selectedSuites.filter(s => s.id === suiteArg);
}

if (selectedSuites.length === 0) {
  console.error(`Không tìm thấy suite nào phù hợp với bộ lọc (role: ${roleArg}, suite: ${suiteArg}). Dùng --list để xem danh mục.`);
  process.exit(1);
}

console.log(`\n=== THỰC THI KIỂM THỬ API BLACK-BOX ===`);
console.log(`Môi trường đích: ${targetEnv.toUpperCase()} (${apiBaseUrl})`);
console.log(`Số lượng suite được chọn: ${selectedSuites.length}`);
console.log(`Chế độ: ${isDryRun ? 'DRY-RUN (Kiểm tra tĩnh file & endpoint)' : isParallel ? 'PARALLEL EXECUTION' : 'SEQUENTIAL EXECUTION'}`);
console.log(`Đồng bộ Qase: ${isSyncQase ? 'ENABLED' : 'DISABLED (Chạy local/offline)'}\n`);

async function runSingleSuite(s) {
  const colFile = path.join(__dirname, s.collection);
  const envFile = path.join(__dirname, s.environment);

  if (!fs.existsSync(colFile)) {
    console.error(`[${s.id}][LỖI] Không tìm thấy file collection: ${colFile}`);
    return { suite: s, success: false };
  }
  if (!fs.existsSync(envFile)) {
    console.error(`[${s.id}][LỖI] Không tìm thấy file environment: ${envFile}`);
    return { suite: s, success: false };
  }

  if (isDryRun) {
    try {
      const colData = JSON.parse(fs.readFileSync(colFile, 'utf8'));
      const itemsCount = colData.item ? colData.item.length : 0;
      console.log(`[${s.id}] [OK] Hợp lệ cú pháp JSON (${s.suiteName}). Số lượng request: ${itemsCount}`);
      return { suite: s, success: true };
    } catch (e) {
      console.error(`[${s.id}] [FAIL] File JSON hỏng: ${e.message}`);
      return { suite: s, success: false };
    }
  } else {
    const reportDir = path.join(__dirname, '..', '..', 'reports', 'api', s.id);
    fs.mkdirSync(reportDir, { recursive: true });

    let newmanBin;
    try {
      newmanBin = require.resolve('newman/bin/newman.js');
    } catch {
      newmanBin = null;
    }

    let cmdArgs = [
      'run', colFile,
      '-e', envFile,
      '--env-var', `baseUrl=${baseUrlOrigin}`,
      '--env-var', `base_url=${baseUrlOrigin}`,
      '--env-var', `apiBaseUrl=${apiBaseUrl}`,
      '--env-var', `stagingOrigin=${baseUrlOrigin}`,
      '--env-var', `adminEmail=${adminEmail}`,
      '--env-var', `adminPassword=${adminPassword}`,
      '--env-var', `password=${adminPassword}`,
      '--env-var', `teacherEmail=${teacherEmail}`,
      '--env-var', `studentEmail=${studentEmail}`,
      '--reporters', 'cli,json',
      '--reporter-json-export', path.join(reportDir, 'report.json')
    ];
    if (isSyncQase && process.env.QASE_API_TOKEN) {
      cmdArgs.push('-r', 'cli,json,qase', '--reporter-qase-project', catalog.qaseProjectCode, '--reporter-qase-logging', 'true');
    }

    return new Promise((resolve) => {
      console.log(`[${s.id}] Bắt đầu chạy newman (${s.suiteName}) trên ${targetEnv.toUpperCase()}...`);
      const child = newmanBin
        ? spawn(process.execPath, [newmanBin, ...cmdArgs], { stdio: 'inherit' })
        : spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['--no-install', 'newman', ...cmdArgs], { stdio: 'inherit', shell: process.platform === 'win32' });
      child.on('close', code => {
        if (code === 0) {
          console.log(`[${s.id}] [PASSED] Hoàn tất thành công.`);
          resolve({ suite: s, success: true });
        } else {
          console.error(`[${s.id}] [FAILED] Thất bại với exit code ${code}.`);
          resolve({ suite: s, success: false });
        }
      });
    });
  }
}

async function main() {
  let totalPassed = 0;
  let totalFailed = 0;

  if (isParallel) {
    const results = await Promise.all(selectedSuites.map(s => runSingleSuite(s)));
    for (const r of results) {
      if (r.success) totalPassed++;
      else totalFailed++;
    }
  } else {
    for (const s of selectedSuites) {
      console.log(`----------------------------------------------------------------`);
      console.log(`Suite: [${s.id}] - ${s.suiteName} (${s.useCases.join(', ')})`);
      const r = await runSingleSuite(s);
      if (r.success) totalPassed++;
      else totalFailed++;
    }
  }

  console.log(`\n================================================================`);
  console.log(`KẾT QUẢ TỔNG HỢP (${targetEnv.toUpperCase()}): ${totalPassed} Passed, ${totalFailed} Failed.`);
  console.log(`================================================================\n`);

  if (totalFailed > 0) {
    process.exit(1);
  }
}

main();
