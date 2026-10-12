const { Builder, Browser, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function runLoginTest() {
  let driver = await new Builder()
    .forBrowser(Browser.CHROME)
    .build();
  
  try {
    await driver.get('http://localhost:5173/login');
    console.log('Login page loaded successfully');
    return true;
  } catch (error) {
    console.error('Test failed:', error);
    return false;
  } finally {
    await driver.quit();
  }
}

runLoginTest();
