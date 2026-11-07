#!/usr/bin/env node
/**
 * Script khôi phục dữ liệu Qase EAM từ bản Backup cục bộ (A, B, C hoặc Full Backup).
 * Cách dùng:
 *   node restore-qase-backup.mjs --mode=abc --dry-run
 *   node restore-qase-backup.mjs --mode=abc --apply
 *   node restore-qase-backup.mjs --mode=full --apply
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const mode = (args.find(a => a.startsWith('--mode=')) || '--mode=abc').split('=')[1];
const apply = args.includes('--apply');

const backupFile = mode === 'full'
  ? path.join(__dirname, 'qase_eam_full_backup_2026-11-06.json')
  : path.join(__dirname, 'qase_eam_ABC_backup_2026-11-06.json');

if (!fs.existsSync(backupFile)) {
  console.error(`Không tìm thấy file backup: ${backupFile}`);
  process.exit(1);
}

const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
console.log(`[Restore Qase Backup] Mode=${mode} | Apply=${apply}`);
console.log(`Suites trong backup: ${backup.suites.length} | Cases trong backup: ${backup.cases.length}`);

if (!apply) {
  console.log('Chế độ --dry-run: Không gọi API thay đổi dữ liệu. Thêm --apply để thực thi khôi phục lên Qase TMS.');
  process.exit(0);
}

const token = process.env.QASE_API_TOKEN || process.env.QASE_TOKEN;
if (!token) {
  console.error('Vui lòng cấu hình biến môi trường QASE_API_TOKEN trước khi chạy --apply.');
  process.exit(1);
}

const headers = {
  'Token': token,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

async function qaseReq(method, endpoint, body) {
  const res = await fetch(`https://api.qase.io/v1${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  return res.json();
}

(async () => {
  const suiteIdMap = new Map();
  // Khôi phục theo thứ tự cha -> con
  const sortedSuites = [...backup.suites].sort((a, b) => (a.parent_id || 0) - (b.parent_id || 0));
  for (const s of sortedSuites) {
    const check = await qaseReq('GET', `/suite/EAM/${s.id}`);
    if (check?.status && check?.result?.id) {
      suiteIdMap.set(s.id, s.id);
    } else {
      const parentId = s.parent_id ? (suiteIdMap.get(s.parent_id) || s.parent_id) : null;
      const created = await qaseReq('POST', '/suite/EAM', {
        title: s.title,
        description: s.description || '',
        preconditions: s.preconditions || '',
        parent_id: parentId
      });
      if (created?.status && created?.result?.id) {
        suiteIdMap.set(s.id, created.result.id);
        console.log(`Đã khôi phục Suite #${s.id} -> #${created.result.id}: ${s.title}`);
      }
    }
  }

  for (const c of backup.cases) {
    const targetSuiteId = c.suite_id ? (suiteIdMap.get(c.suite_id) || c.suite_id) : null;
    const check = await qaseReq('GET', `/case/EAM/${c.id}`);
    const payload = {
      title: c.title,
      suite_id: targetSuiteId,
      description: c.description || '',
      preconditions: c.preconditions || '',
      severity: c.severity || 4,
      priority: c.priority || 2,
      type: c.type || 1,
      layer: c.layer || 1,
      is_flaky: c.is_flaky || 0,
      behavior: c.behavior || 1,
      automation: c.automation || 0,
      status: c.status || 0,
      tags: (c.tags || []).map(t => t.title),
      steps: (c.steps || []).map(st => ({
        action: st.action || '',
        expected_result: st.expected_result || '',
        data: st.data || ''
      }))
    };
    if (check?.status && check?.result?.id) {
      await qaseReq('PATCH', `/case/EAM/${c.id}`, payload);
      console.log(`Đã khôi phục (PATCH) Case #${c.id}: ${c.title}`);
    } else {
      const created = await qaseReq('POST', '/case/EAM', payload);
      console.log(`Đã tạo lại (POST) Case #${c.id} -> #${created?.result?.id}: ${c.title}`);
    }
  }
  console.log('Hoàn tất khôi phục từ bản backup!');
})();
