import { By, until } from 'selenium-webdriver';

export class TeacherEditAssignmentPage {
  constructor(driver) {
    this.driver = driver;
  }

  async waitForEditPage() {
    await this.driver.wait(until.urlContains('/edit'), 15000);
    return this;
  }

  async switchTab(tabName) {
    const tabs = await this.driver.findElements(By.xpath(//*[contains(text(), \"\")]));
    if (tabs.length > 0) {
      await tabs[0].click();
      return true;
    }
    return false;
  }

  async clickPreview() {
    const btns = await this.driver.findElements(By.xpath('//*[contains(text(), \"Xem thử\") or contains(text(), \"Preview\")]'));
    if (btns.length > 0) {
      await btns[0].click();
      return true;
    }
    return false;
  }

  async saveDraft() {
    const btns = await this.driver.findElements(By.xpath('//*[contains(text(), \"Lưu bản nháp\") or contains(text(), \"Save draft\")]'));
    if (btns.length > 0) {
      await btns[0].click();
      return true;
    }
    return false;
  }
}
