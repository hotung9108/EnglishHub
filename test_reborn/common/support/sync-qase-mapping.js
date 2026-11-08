import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { QaseAdapter } from './qase-adapter.js';
import { loadLocalEnv } from '../config/env.js';

loadLocalEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script xác thực và đồng bộ file qase-mapping.json với Qase TMS
 */
async function main() {
  console.log('================================================================');
  console.log('  Qase TMS Mapping Verifier & Synchronizer');
  console.log('================================================================\n');

  const mappingPath = path.join(__dirname, 'qase-mapping.json');
  if (!fs.existsSync(mappingPath)) {
    console.error(`[ERROR] Không tìm thấy file: ${mappingPath}`);
    process.exit(1);
  }

  const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
  const totalCases = Object.keys(mapping).length;
  console.log(`[1] Đọc local mapping: ${totalCases} test cases.`);

  const qase = new QaseAdapter({ enabled: true });
  if (!qase.enabled) {
    console.log('[Offline] QASE_API_TOKEN không khả dụng. Xác thực cấu trúc local mapping:');
    verifyLocalStructure(mapping);
    return;
  }

  console.log('[2] Đang kiểm tra đối chiếu mẫu trên Qase TMS (API)...');
  const samples = ['ADM-001', 'ADM-050', 'TEA-001', 'TEA-051', 'STU-001', 'STU-045'];
  
  for (const localId of samples) {
    const qaseId = mapping[localId];
    if (!qaseId) {
      console.warn(`  [!] Thiếu mapping cho ${localId}`);
      continue;
    }

    const res = await qase._request('GET', `/case/${qase.projectCode}/${qaseId}`);
    if (res?.status && res.result?.title) {
      const titleMatches = res.result.title.includes(localId);
      console.log(`  [OK] ${localId} -> Qase #${qaseId}: "${res.result.title.slice(0, 50)}..." [${titleMatches ? 'MATCH' : 'MISMATCH'}]`);
    } else {
      console.warn(`  [FAIL] Không thể fetch Qase case #${qaseId} (${localId}):`, res?.error || 'Unknown error');
    }
  }

  console.log('\n[3] Tổng kết kiểm tra cấu trúc mapping:');
  verifyLocalStructure(mapping);
}

function verifyLocalStructure(mapping) {
  let admCount = 0;
  let teaCount = 0;
  let stuCount = 0;
  const ids = new Set();
  const qaseIds = new Set();
  let duplicates = 0;

  for (const [localId, qaseId] of Object.entries(mapping)) {
    if (localId.startsWith('ADM-')) admCount++;
    else if (localId.startsWith('TEA-')) teaCount++;
    else if (localId.startsWith('STU-')) stuCount++;

    if (ids.has(localId)) {
      console.warn(`  Duplicate local ID: ${localId}`);
      duplicates++;
    }
    ids.add(localId);

    if (qaseIds.has(qaseId)) {
      console.warn(`  Duplicate Qase ID: ${qaseId} for ${localId}`);
      duplicates++;
    }
    qaseIds.add(qaseId);
  }

  console.log(`  - Admin cases:   ${admCount}/50`);
  console.log(`  - Teacher cases: ${teaCount}/51`);
  console.log(`  - Student cases: ${stuCount}/45`);
  console.log(`  - Tổng số cases: ${ids.size}/146`);
  console.log(`  - Trùng lặp:     ${duplicates}`);

  if (ids.size === 146 && duplicates === 0) {
    console.log('\n[SUCCESS] File qase-mapping.json hợp lệ 100%, không trùng lặp!');
  } else {
    console.error('\n[ERROR] Phát hiện bất thường trong file mapping!');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
