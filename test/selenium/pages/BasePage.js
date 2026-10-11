import { until } from 'selenium-webdriver';

export class BasePage {
  constructor(driver, config) { this.driver = driver; this.config = config; }

  async visible(locator) {
    const element = await this.driver.wait(until.elementLocated(locator), this.config.timeout);
    await this.driver.wait(until.elementIsVisible(element), this.config.timeout);
    return element;
  }
}
