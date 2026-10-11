import { By, until } from 'selenium-webdriver';

export class TeacherAssignmentsPage {
  constructor(driver) {
    this.driver = driver;
  }

  async navigate(baseUrl) {
    await this.driver.get(${baseUrl}/teacher/assignments);
    return this;
  }

  async waitForList() {
    await this.driver.wait(until.elementLocated(By.css('.assignment-card, [data-testid=\"assignment-card\"]')), 15000);
    return this;
  }

  async clickEditFirst() {
    const btns = await this.driver.findElements(By.xpath('//*[contains(text(), \"Chỉnh sửa\") or contains(text(), \"Edit\")]'));
    if (btns.length > 0) {
      await btns[0].click();
      return true;
    }
    return false;
  }
}
