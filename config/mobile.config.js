require('./android.environment');

const mobileConfig = {
  hostname: process.env.APPIUM_HOST || '127.0.0.1',
  port: Number(process.env.APPIUM_PORT || 4723),
  path: '/',
  logLevel: 'silent',
  connectionRetryTimeout: 120000,
  connectionRetryCount: 0,
  waitforTimeout: 10000,
  waitforInterval: 500,
  capabilities: {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': process.env.ANDROID_DEVICE_NAME || 'SM_M145F',
    'appium:udid': process.env.ANDROID_UDID || 'R9ZX90ENVFB',
    'appium:appPackage': process.env.ANDROID_APP_PACKAGE || 'com.tiwil',
    'appium:appActivity': process.env.ANDROID_APP_ACTIVITY || '.MainActivity',
    'appium:noReset': true,
    'appium:fullReset': false,
    'appium:shouldTerminateApp': false,
    'appium:newCommandTimeout': 420,
    'appium:adbExecTimeout': 30000,
    'appium:uiautomator2ServerInstallTimeout': 120000,
    'appium:uiautomator2ServerLaunchTimeout': 60000,
  },
};

module.exports = {mobileConfig};
