const {connectAndroid} = require('./android-device');
const {mobileConfig} = require('../config/mobile.config');

(async () => {
  const device = await connectAndroid();
  try {
    const pkg = await device.driver.getCurrentPackage();
    const activity = await device.driver.getCurrentActivity();
    if (pkg !== mobileConfig.capabilities['appium:appPackage']) {
      throw new Error(`Expected TIWIL in foreground, got ${pkg}`);
    }
    const source = await device.driver.getPageSource();
    if (!source.includes('<hierarchy')) throw new Error('Native hierarchy could not be read.');
    // Select an actually exposed, unique text rather than guessing a screen.
    const texts = [...source.matchAll(/<[\w.]+\b([^>]+)>/g)]
      .filter(match => match[1].includes(`package="${pkg}"`))
      .map(match => match[1].match(/\btext="([^"]*)"/)?.[1] || '');
    const uniqueText = texts.find(text => text && !text.includes('&')
      && texts.filter(value => value === text).length === 1);
    if (!uniqueText) throw new Error('No unique native text is available for the element-wait check.');
    await device.wait({pkg, text: uniqueText}, {timeout: 10000});
    const screenshot = await device.driver.takeScreenshot();
    if (Buffer.from(screenshot, 'base64').length < 8) throw new Error('Native screenshot is empty.');
    console.log(JSON.stringify({sessionCreated: true, package: pkg, activity,
      automationName: device.driver.capabilities.automationName || 'UiAutomator2',
      nativeHierarchyReadable: true, nativeElementWaitPassed: true,
      screenshotAvailable: true}, null, 2));
  } finally {await device.close();}
})().catch(error => {console.error(error.message); process.exitCode = 1;});
