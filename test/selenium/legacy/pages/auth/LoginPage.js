import { By, until } from 'selenium-webdriver';

export class LoginPage {
  constructor(driver) {
    this.driver = driver;
  }

  async navigate(baseUrl) {
    await this.driver.get(${baseUrl}/login);
    return this;
  }

  async login(email, password) {
    await this.driver.wait(until.elementLocated(By.css('input[type=\"email\"], input[name=\"email\"]')), 10000);
    const emailInput = await this.driver.findElement(By.css('input[type=\"email\"], input[name=\"email\"]'));
    const passInput = await this.driver.findElement(By.css('input[type=\"password\"], input[name=\"password\"]'));
    await emailInput.clear();
    await emailInput.sendKeys(email);
    await passInput.clear();
    await passInput.sendKeys(password);
    const submit = await this.driver.findElement(By.css('button[type=\"submit\"]'));
    await submit.click();
    return this;
  }
}
