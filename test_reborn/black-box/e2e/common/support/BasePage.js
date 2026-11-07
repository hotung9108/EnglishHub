import { until } from 'selenium-webdriver';

export class BasePage {
  constructor(driver, config) { this.driver = driver; this.config = config; }

  async step(label, element) {
    if (!this.config.observeMs) return;
    this.config.onStep?.(label);
    // Observation pacing only. DOM readiness is still checked with explicit waits.
    await this.driver.executeScript(`
      const previous = document.querySelector('[data-qa29-highlight]');
      if (previous) { previous.style.outline = previous.dataset.qa29OldOutline || ''; previous.removeAttribute('data-qa29-highlight'); }
      if (arguments[1]) {
        arguments[1].scrollIntoView({block:'center'});
        arguments[1].dataset.qa29OldOutline = arguments[1].style.outline;
        arguments[1].setAttribute('data-qa29-highlight', 'true');
        arguments[1].style.outline = '3px solid #f59e0b';
      }
      let panel = document.getElementById('qa29-observer');
      if (!panel && document.body) {
        panel = document.createElement('div'); panel.id = 'qa29-observer';
        panel.style.cssText = 'position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#172230;color:white;padding:12px 18px;border-radius:8px;font:15px system-ui;max-width:70vw;pointer-events:none;box-shadow:0 3px 12px #0004';
        document.body.appendChild(panel);
      }
      if (panel) panel.textContent = arguments[0];
    `, `${this.config.observeCase || 'QA-29'} · ${label}`, element || null);
    await this.driver.sleep(this.config.observeMs);
  }

  async clickElement(element, label) {
    await this.driver.wait(until.elementIsEnabled(element), this.config.timeout);
    await this.driver.executeScript('arguments[0].scrollIntoView({block:"center"});', element);
    await this.step(label || (await element.getText()).trim() || await element.getAttribute('title') || 'Bấm nút trên giao diện', element);
    await element.click();
  }

  async visible(locator) {
    const element = await this.driver.wait(until.elementLocated(locator), this.config.timeout);
    await this.driver.wait(until.elementIsVisible(element), this.config.timeout);
    return element;
  }
}
