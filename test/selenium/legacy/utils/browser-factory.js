import { Builder, Browser } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import { getSeleniumConfig } from './env-helper.js';

export async function createDriver() {
  const cfg = getSeleniumConfig();
  const options = new chrome.Options();
  if (cfg.headless) {
    options.addArguments('--headless=new');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');
  }
  const driver = await new Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(options)
    .build();
  return driver;
}
