import { By, until } from 'selenium-webdriver';

export class AssignmentPreviewModal {
  constructor(driver) {
    this.driver = driver;
  }

  async waitForModal() {
    await this.driver.wait(until.elementLocated(By.css('.modal, [role=\"dialog\"]')), 10000);
    return this;
  }

  async close() {
    const closes = await this.driver.findElements(By.css('.close, [data-testid=\"close-preview\"]'));
    if (closes.length > 0) {
      await closes[0].click();
      return true;
    }
    return false;
  }
}
