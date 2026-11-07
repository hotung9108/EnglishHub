import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import edge from 'selenium-webdriver/edge.js';
import path from 'node:path';
import { root } from '../../config/env.js';

export async function createDriver(config) {
  // Keep driver downloads inside workspace cache
  process.env.SE_CACHE_PATH ||= path.join(root, '.cache', 'selenium');
  const module = config.browser === 'edge' ? edge : chrome;
  const options = new module.Options();

  // Standard Full HD resolution (USA-01..USA-06 Usability Compliance)
  options.addArguments('--window-size=1920,1080');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--disable-component-update');
  options.addArguments('--disable-background-networking');
  options.addArguments('--host-resolver-rules=MAP minio 127.0.0.1');
  options.addArguments('--log-level=3');
  if (config.browser !== 'edge') {
    options.excludeSwitches('enable-logging');
  }

  // PRESERVE USABILITY & VISUAL INTEGRITY:
  // - Images are explicitly kept enabled (imagesEnabled=true)
  // - CSS animations and transitions are NOT disabled
  options.setUserPreferences({
    'profile.managed_default_content_settings.images': 1,
    ...(config.downloadDir ? {
      'download.default_directory': config.downloadDir,
      'download.prompt_for_download': false
    } : {})
  });

  if (config.captureNetwork && config.browser === 'chrome') {
    options.setLoggingPrefs({ performance: 'ALL' });
  }
  if (config.fakeMedia) {
    options.addArguments('--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream');
  }
  if (config.headless) {
    options.addArguments('--headless=new');
  }
  if (config.binary) {
    if (config.browser === 'edge') options.setEdgeChromiumBinaryPath(config.binary);
    else options.setChromeBinaryPath(config.binary);
  }

  const builder = new Builder().forBrowser(config.browser);
  if (config.browser === 'edge') builder.setEdgeOptions(options);
  else builder.setChromeOptions(options);

  if (config.gridUrl) {
    builder.usingServer(config.gridUrl);
  } else if (config.driverPath) {
    const service = new module.ServiceBuilder(config.driverPath);
    if (config.browser === 'edge') builder.setEdgeService(service);
    else builder.setChromeService(service);
  }

  const driver = await builder.build();
  try {
    if (config.downloadDir && config.browser !== 'edge') {
      try {
        await driver.sendDevToolsCommand('Page.setDownloadBehavior', {
          behavior: 'allow',
          downloadPath: config.downloadDir
        });
      } catch {}
    }
    await driver.manage().setTimeouts({ implicit: 0, pageLoad: config.timeout, script: config.timeout });
    return driver;
  } catch (error) {
    await driver.quit();
    throw error;
  }
}
