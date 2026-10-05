import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadConfig() {
  const env = process.env.TEST_ENV || 'dev';
  const configPath = path.join(__dirname, ${env}.json);
  
  if (!fs.existsSync(configPath)) {
    throw new Error(Config file not found: );
  }
  
  const raw = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(raw);
}

export default { loadConfig };
