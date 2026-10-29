const {test: base, expect} = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');
const {connectAndroid} = require('../helpers/android-device');

const test = base.extend({
  device: [async ({}, use, testInfo) => {
    const device = await connectAndroid();
    try {
      await use(device);
    } finally {
      try {
        if (testInfo.status !== testInfo.expectedStatus) {
          try {
            const screenshot = testInfo.outputPath('failure.png');
            await device.driver.saveScreenshot(screenshot);
            await testInfo.attach('Android failure screenshot', {path: screenshot, contentType: 'image/png'});
          } catch (error) {console.warn('Failure screenshot unavailable:', error.message);}
        }
        const log = {title: testInfo.title, status: testInfo.status,
          expectedStatus: testInfo.expectedStatus, durationMs: testInfo.duration,
          udid: device.driver.capabilities['appium:udid'], recordedAt: new Date().toISOString()};
        const logPath = testInfo.outputPath('mobile-session.json');
        await fs.mkdir(path.dirname(logPath), {recursive: true});
        await fs.writeFile(logPath, JSON.stringify(log, null, 2));
        await testInfo.attach('Mobile session summary', {path: logPath, contentType: 'application/json'});
      } finally {await device.close();}
    }
  }, {timeout: 180000}],
});

module.exports = {test, expect};
