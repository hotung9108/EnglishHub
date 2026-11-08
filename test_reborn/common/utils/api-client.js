import axios from 'axios';
import { config } from '../config/env.js';

export function createApiClient(token = null) {
  const client = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });

  return client;
}
