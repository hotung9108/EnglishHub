import { loadConfig } from '../config/env-loader.js';

try {
  const cfg = loadConfig();
  console.log('[ENV CHECK]', cfg.env, cfg.frontend.baseUrl, cfg.backend.baseUrl);
} catch (e) {
  console.error('[ENV CHECK ERROR]', e.message);
  process.exit(1);
}
