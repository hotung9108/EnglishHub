import fs from 'node:fs/promises';
import path from 'node:path';

const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

export function sanitize(message, users) {
  let text = String(message);
  for (const user of Object.values(users)) {
    for (const secret of [user.email, user.password]) if (secret) text = text.split(secret).join('[REDACTED]');
  }
  return text;
}

export async function writeReport(directory, report) {
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, 'summary.json'), JSON.stringify(report, null, 2));
  const rows = report.cases.map(c => `<tr><td>${escape(c.id)}</td><td>${escape(c.title)}</td><td>${escape(c.status)}</td><td>${escape(c.reason)}</td><td>${c.screenshot ? `<a href="${escape(c.screenshot)}">Screenshot</a>` : ''}</td></tr>`).join('');
  await fs.writeFile(path.join(directory, 'report.html'), `<!doctype html><html lang="vi"><meta charset="utf-8"><title>QA-28 Selenium</title><style>body{font:16px system-ui;margin:40px;line-height:1.5}table{border-collapse:collapse;width:100%}td,th{border:1px solid #bbb;padding:12px;text-align:left}p{max-width:1000px}</style><h1>QA-28 · Selenium Framework</h1><p>Mode: ${escape(report.mode)} · URL: ${escape(report.baseUrl)} · Browser: ${escape(report.browser)} · ${escape(report.startedAt)}</p><p>Status: <b>${escape(report.status)}</b>. ${escape(report.scope)}</p><table><tr><th>ID</th><th>Test</th><th>Status</th><th>Evidence / reason</th><th>Image</th></tr>${rows}</table></html>`);
}
