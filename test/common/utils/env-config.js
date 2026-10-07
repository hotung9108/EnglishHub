import { loadConfig } from '../../config/env-loader.js';

const config = loadConfig();

export const getConfig = () => config;
export const getBaseUrl = (service = 'frontend') => {
  const map = {
    frontend: config.frontend.baseUrl,
    backend: config.backend.baseUrl,
    api: config.backend.baseUrl + config.backend.apiPrefix,
    ai: config.aiService.baseUrl
  };
  return map[service] || config.frontend.baseUrl;
};
