import { loadConfig } from '../../config/env-loader.js';

const config = loadConfig();

export function getSeleniumConfig() {
  return config.selenium;
}

export function getFrontendUrl() {
  return config.frontend.baseUrl;
}

export function getUsers() {
  return config.users;
}
