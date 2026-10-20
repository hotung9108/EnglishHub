import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import edge from 'selenium-webdriver/edge.js';
import path from 'node:path';
import { root } from '../config/env.js';

export async function createDriver(config) {
  // Keep driver downloads inside this workspace, independent of the user's cache.
  process.env.SE_CACHE_PATH ||= path.join(root, '.cache', 'selenium');
  const module = config.browser === 'edge' ? edge : chrome;
  const options = new module.Options();
  options.addArguments('--window-size=1440,1000');
  if (config.captureNetwork && config.browser === 'chrome') options.setLoggingPrefs({ performance: 'ALL' });
  if (config.fakeMedia) options.addArguments('--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream');
  if (config.downloadDir) options.setUserPreferences({ 'download.default_directory': config.downloadDir, 'download.prompt_for_download': false });
  if (config.headless) options.addArguments('--headless=new');
  if (config.binary) {
    if (config.browser === 'edge') options.setEdgeChromiumBinaryPath(config.binary);
    else options.setChromeBinaryPath(config.binary);
  }
  const builder = new Builder().forBrowser(config.browser);
  if (config.browser === 'edge') builder.setEdgeOptions(options);
  else builder.setChromeOptions(options);
  if (config.gridUrl) builder.usingServer(config.gridUrl);
  else if (config.driverPath) {
    const service = new module.ServiceBuilder(config.driverPath);
    if (config.browser === 'edge') builder.setEdgeService(service);
    else builder.setChromeService(service);
  }
  const driver = await builder.build();
  try {
    await driver.manage().setTimeouts({ implicit: 0, pageLoad: config.timeout, script: config.timeout });
    return driver;
  } catch (error) {
    await driver.quit();
    throw error;
  }
}
