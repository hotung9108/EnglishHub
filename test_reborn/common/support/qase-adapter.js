import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Qase TMS Integration Adapter for EnglishHub
 * Project: EAM (English Assignment Management)
 * SSoT: docs/core/01.SRS.md & 03.TP.md
 */
export class QaseAdapter {
  constructor(options = {}) {
    this.token = options.token || process.env.QASE_API_TOKEN;
    this.projectCode = options.projectCode || process.env.QASE_PROJECT_CODE || 'EAM';
    this.runId = options.runId || process.env.QASE_RUN_ID;
    this.enabled = Boolean(this.token && (options.enabled ?? process.env.QASE_ENABLED === 'true'));
    this.baseUrl = 'api.qase.io';

    // Load case ID mapping from qase-mapping.json
    this.mapping = options.mapping || {};
    try {
      const mappingPath = path.join(__dirname, 'qase-mapping.json');
      if (fs.existsSync(mappingPath)) {
        this.mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
      }
    } catch {
      this.mapping = {};
    }
  }

  /**
   * Tra cứu Qase Case ID thật từ mã local (ADM-001, TEA-001, STU-001)
   */
  resolveCaseId(caseId) {
    if (typeof caseId === 'number' && Number.isInteger(caseId) && caseId > 0) {
      return caseId;
    }
    const strId = String(caseId).trim();
    if (this.mapping && this.mapping[strId]) {
      return this.mapping[strId];
    }
    if (/^\d+$/.test(strId)) {
      const num = parseInt(strId, 10);
      if (num > 0) return num;
    }
    return null;
  }

  /**
   * Send HTTP request to Qase API v1
   */
  async _request(method, endpoint, data = null) {
    if (!this.enabled) {
      return { status: true, offline: true };
    }

    return new Promise((resolve, reject) => {
      const payload = data ? JSON.stringify(data) : null;
      const options = {
        hostname: this.baseUrl,
        port: 443,
        path: `/v1${endpoint}`,
        method: method,
        headers: {
          'Token': this.token,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              console.warn(`[Qase API Warning] ${method} ${endpoint} trả về HTTP ${res.statusCode}:`, parsed.errorMessage || body);
              resolve({ status: false, statusCode: res.statusCode, error: parsed.errorMessage || body });
            }
          } catch (err) {
            resolve({ status: false, raw: body });
          }
        });
      });

      req.on('error', (e) => {
        console.warn(`[Qase API Error] Lỗi kết nối mạng: ${e.message}`);
        resolve({ status: false, networkError: e.message });
      });

      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  }

  /**
   * Khởi tạo Test Run mới nếu chưa có RUN_ID
   */
  async startRun(title = 'Automated Test Run - EnglishHub', description = '') {
    if (!this.enabled) {
      console.log(`[Qase Adapter] Chế độ Offline/Local: Bỏ qua tạo Run trên Qase.`);
      return null;
    }
    if (this.runId) {
      console.log(`[Qase Adapter] Sử dụng Run ID sẵn có: ${this.runId}`);
      return this.runId;
    }

    const payload = {
      title: `${title} [${new Date().toISOString()}]`,
      description: description || 'Tự động kích hoạt từ test_reborn framework',
      is_autotest: true
    };

    const res = await this._request('POST', `/run/${this.projectCode}`, payload);
    if (res.status && res.result?.id) {
      this.runId = res.result.id;
      console.log(`[Qase Adapter] Đã tạo thành công Test Run #${this.runId} trên project ${this.projectCode}`);
      return this.runId;
    }
    return null;
  }

  /**
   * Gửi kết quả từng test case (Passed, Failed, Blocked) với Mapping an toàn
   */
  async recordResult(caseId, status, { timeMs = 0, comment = '', stackTrace = '' } = {}) {
    if (!this.enabled || !this.runId) return;

    // Normalizing status: passed | failed | blocked | in_progress | skipped
    const validStatus = ['passed', 'failed', 'blocked', 'skipped'].includes(status) ? status : 'failed';
    const targetCaseId = this.resolveCaseId(caseId);

    if (!targetCaseId) {
      console.warn(`[Qase Adapter Warning] Không tìm thấy mapping trên Qase cho Case ID: "${caseId}". Bỏ qua để tránh ghi đè sai dữ liệu.`);
      return { status: false, skipped: true, reason: 'unmapped_case_id' };
    }

    const payload = {
      case_id: targetCaseId,
      status: validStatus,
      time_ms: timeMs,
      comment: comment + (stackTrace ? `\n\nStack Trace:\n${stackTrace}` : '')
    };

    const res = await this._request('POST', `/result/${this.projectCode}/${this.runId}`, payload);
    if (res?.status) {
      console.log(`[Qase Sync] Mapped ${caseId} -> Qase #${targetCaseId} [${validStatus.toUpperCase()}]`);
    }
    return res;
  }

  /**
   * Tải ảnh chụp màn hình (screenshot) lỗi lên Qase
   */
  async uploadScreenshot(filePath) {
    if (!this.enabled || !fs.existsSync(filePath)) return null;

    // Boundary multipart upload to /v1/attachment/{code}
    return new Promise((resolve) => {
      const boundary = '----QaseFormBoundary' + Math.random().toString(36).substring(2);
      const filename = path.basename(filePath);
      const fileData = fs.readFileSync(filePath);

      const pre = Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`
      );
      const post = Buffer.from(`\r\n--${boundary}--\r\n`);
      const body = Buffer.concat([pre, fileData, post]);

      const req = https.request({
        hostname: this.baseUrl,
        port: 443,
        path: `/v1/attachment/${this.projectCode}`,
        method: 'POST',
        headers: {
          'Token': this.token,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length
        }
      }, (res) => {
        let resBody = '';
        res.on('data', c => resBody += c);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(resBody);
            resolve(parsed.result?.[0]?.hash || null);
          } catch {
            resolve(null);
          }
        });
      });

      req.on('error', () => resolve(null));
      req.write(body);
      req.end();
    });
  }

  /**
   * Đóng Test Run khi suite kết thúc
   */
  async completeRun() {
    if (!this.enabled || !this.runId) return;
    const res = await this._request('POST', `/run/${this.projectCode}/${this.runId}/complete`);
    console.log(`[Qase Adapter] Hoàn thành Test Run #${this.runId} trên Qase.`);
    return res;
  }
}
