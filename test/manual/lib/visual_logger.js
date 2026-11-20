const fs = require('fs');
const path = require('path');
const config = require('../config/manual_config');

class VisualLogger {
  constructor() {
    this.catalog = [];
  }

  async captureScreenshot(driver, category, fileName, description, meta = {}) {
    const targetDir = path.join(config.screenshotsDir, category);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const fullPath = path.join(targetDir, `${fileName}.png`);
    try {
      const imageBase64 = await driver.takeScreenshot();
      fs.writeFileSync(fullPath, imageBase64, 'base64');

      const currentUrl = await driver.getCurrentUrl().catch(() => 'unknown');
      const pageTitle = await driver.getTitle().catch(() => 'unknown');

      const entry = {
        category,
        fileName: `${fileName}.png`,
        filePath: fullPath,
        relativeUrl: path.relative(config.reportsDir, fullPath).replace(/\\/g, '/'),
        projectRelativePath: path.relative(config.rootDir, fullPath).replace(/\\/g, '/'),
        description,
        currentUrl,
        pageTitle,
        timestamp: new Date().toISOString(),
        ...meta
      };

      this.catalog.push(entry);
      console.log(`  [SCREENSHOT] (${category}) -> ${fileName}.png [${description}]`);
      return entry;
    } catch (err) {
      console.error(`  [WARN] Failed to capture screenshot ${fileName}:`, err.message);
      return null;
    }
  }

  getCatalog() {
    return this.catalog;
  }
}

module.exports = new VisualLogger();
