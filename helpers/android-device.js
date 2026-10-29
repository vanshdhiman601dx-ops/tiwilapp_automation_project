const {mobileConfig} = require('../config/mobile.config');
const {sdkHome} = require('../config/android.environment');
const path = require('node:path');
const {execFile} = require('node:child_process');
const {promisify} = require('node:util');

// Compatibility layer: the existing single loginfun(device) flow stays intact.
// Native actions are performed by Appium, not Playwright's experimental driver.
function nativeSelector(selector) {
  let query = 'new UiSelector()';
  const fields = {pkg: 'packageName', clazz: 'className', text: 'text', res: 'resourceId', desc: 'description'};
  for (const [key, method] of Object.entries(fields)) {
    if (selector[key] !== undefined) {
      if (typeof selector[key] !== 'string') throw new Error(`Unsupported native selector: ${key}`);
      query += `.${method}(${JSON.stringify(selector[key])})`;
    }
  }
  if (!selector.pkg) query += `.packageName(${JSON.stringify(mobileConfig.capabilities['appium:appPackage'])})`;
  return `android=${query}`;
}

async function connectAndroid() {
  try {
    const {stdout} = await promisify(execFile)(path.join(sdkHome, 'platform-tools', 'adb.exe'),
      ['-s', mobileConfig.capabilities['appium:udid'], 'get-state'], {windowsHide: true, timeout: 15000});
    if (stdout.trim() !== 'device') throw new Error('Device is not authorized and online.');
  } catch (error) {
    throw new Error(`Configured Android phone ${mobileConfig.capabilities['appium:udid']} is not available. Run npm.cmd run android:devices and update ANDROID_UDID in .env if the phone changed. Otherwise unlock the phone and allow USB debugging.`, {cause: error});
  }
  const {remote} = await import('webdriverio');
  const driver = await remote(mobileConfig);
  try {
    await driver.setTimeout({implicit: 0});
  } catch (error) {
    await driver.deleteSession().catch(() => {});
    throw error;
  }
  return {
    driver,
    async wait(selector, {timeout = 10000, state} = {}) {
      const element = await driver.$(nativeSelector(selector));
      await element.waitForDisplayed({timeout, reverse: state === 'gone'});
    },
    async tap(selector, {timeout = 10000} = {}) {
      const element = await driver.$(nativeSelector(selector));
      await element.waitForDisplayed({timeout});
      await element.waitForEnabled({timeout});
      await element.click();
    },
    async fill(selector, value, {timeout = 10000} = {}) {
      const element = await driver.$(nativeSelector(selector));
      await element.waitForDisplayed({timeout});
      await element.waitForEnabled({timeout});
      await element.setValue(value);
    },
    async shell(command) {
      if (command !== 'uiautomator dump /dev/tty') throw new Error('Arbitrary shell commands are not enabled.');
      return Buffer.from(await driver.getPageSource());
    },
    async close() {await driver.deleteSession();},
  };
}

module.exports = {connectAndroid, nativeSelector};
