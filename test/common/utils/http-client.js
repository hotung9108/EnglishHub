import axios from 'axios';
import { getBaseUrl } from './env-config.js';

export function createApiClient(basePath = 'api') {
  const baseURL = getBaseUrl(basePath);
  return axios.create({
    baseURL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' }
  });
}
