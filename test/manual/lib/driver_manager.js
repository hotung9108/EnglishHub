const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');
const config = require('../config/manual_config');

class DriverManager {
  constructor() {
    this.driver = null;
  }

  async initDriver(options = {}) {
    const isHeadless = options.headless !== false;
    const viewport = options.viewport || config.viewports.desktop;

    const chromeOptions = new chrome.Options();
    chromeOptions.addArguments(`--window-size=${viewport.width},${viewport.height}`);
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');
    chromeOptions.addArguments('--disable-component-update');
    chromeOptions.addArguments('--disable-background-networking');
    chromeOptions.addArguments('--log-level=3');
    chromeOptions.excludeSwitches('enable-logging');

    // PRESERVE 100% VISUAL INTEGRITY
    chromeOptions.setUserPreferences({
      'profile.managed_default_content_settings.images': 1
    });

    if (isHeadless) {
      chromeOptions.addArguments('--headless=new');
    }

    const builder = new Builder().forBrowser('chrome').setChromeOptions(chromeOptions);
    this.driver = await builder.build();

    await this.driver.manage().setTimeouts({
      pageLoad: config.timeouts.pageLoad,
      script: config.timeouts.pageLoad,
      implicit: 0
    });

    return this.driver;
  }

  async setViewport(width, height) {
    if (!this.driver) return;
    await this.driver.manage().window().setRect({ width, height });
    await this.sleep(400);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async safeFind(selector, timeoutMs = config.timeouts.elementWait) {
    try {
      const el = await this.driver.wait(until.elementLocated(By.css(selector)), timeoutMs);
      await this.driver.wait(until.elementIsVisible(el), timeoutMs);
      return el;
    } catch {
      return null;
    }
  }

  async safeFindXPath(xpath, timeoutMs = config.timeouts.elementWait) {
    try {
      const el = await this.driver.wait(until.elementLocated(By.xpath(xpath)), timeoutMs);
      await this.driver.wait(until.elementIsVisible(el), timeoutMs);
      return el;
    } catch {
      return null;
    }
  }

  async safeClick(selector, timeoutMs = config.timeouts.elementWait) {
    const el = await this.safeFind(selector, timeoutMs);
    if (el) {
      await el.click();
      await this.sleep(config.timeouts.actionDelay);
      return true;
    }
    return false;
  }

  async safeClickXPath(xpath, timeoutMs = config.timeouts.elementWait) {
    const el = await this.safeFindXPath(xpath, timeoutMs);
    if (el) {
      await el.click();
      await this.sleep(config.timeouts.actionDelay);
      return true;
    }
    return false;
  }

  async safeClickAny(selectors, timeoutMs = 3000) {
    for (const sel of selectors) {
      try {
        const isXp = sel.startsWith('//') || sel.startsWith('(');
        const el = isXp ? await this.safeFindXPath(sel, timeoutMs) : await this.safeFind(sel, timeoutMs);
        if (el) {
          await el.click();
          await this.sleep(config.timeouts.actionDelay);
          return true;
        }
      } catch {}
    }
    return false;
  }

  async safeType(selector, text, timeoutMs = config.timeouts.elementWait) {
    const el = await this.safeFind(selector, timeoutMs);
    if (el) {
      await el.clear();
      await el.sendKeys(text);
      await this.sleep(200);
      return true;
    }
    return false;
  }

  async quit() {
    if (this.driver) {
      try {
        await this.driver.quit();
      } catch {}
      this.driver = null;
    }
  }
}

module.exports = new DriverManager();
