const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const envFile = path.join(root, '.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

// Configure only this process and its children; no machine-wide settings change.
const javaHome = process.env.JAVA_HOME || 'C:\\Program Files\\Android\\Android Studio\\jbr';
const sdkHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT
  || path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk');
if (!fs.existsSync(path.join(javaHome, 'bin', 'javac.exe'))) {
  throw new Error('Set JAVA_HOME to an installed JDK containing bin/javac.exe.');
}
if (!fs.existsSync(path.join(sdkHome, 'platform-tools', 'adb.exe'))) {
  throw new Error('Set ANDROID_HOME to the installed Android SDK.');
}
process.env.JAVA_HOME = javaHome;
process.env.ANDROID_HOME = sdkHome;
process.env.ANDROID_SDK_ROOT = sdkHome;
process.env.PATH = [path.join(javaHome, 'bin'), path.join(sdkHome, 'platform-tools'),
  path.join(sdkHome, 'emulator'), process.env.PATH].join(path.delimiter);

module.exports = {root, javaHome, sdkHome};
