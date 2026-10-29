require('../config/android.environment');
const path = require('node:path');
const fs = require('node:fs');
const {spawn} = require('node:child_process');

const cli = process.env.APPIUM_CLI || path.join(process.env.APPDATA, 'npm', 'node_modules', 'appium', 'index.js');
if (!fs.existsSync(cli)) throw new Error('Appium CLI not found. Set APPIUM_CLI to its index.js path.');
const args = process.argv.slice(2);
if (args.length === 0) {
  const logDir = path.resolve(__dirname, '..', 'logs');
  fs.mkdirSync(logDir, {recursive: true});
  args.push('--address', process.env.APPIUM_HOST || '127.0.0.1',
    '--port', process.env.APPIUM_PORT || '4723', '--log-level', 'warn',
    '--log', path.join(logDir, 'appium.log'), '--log-timestamp');
}
const child = spawn(process.execPath, [cli, ...args], {stdio: 'inherit', windowsHide: true, env: process.env});
child.on('error', error => {console.error(error.message); process.exitCode = 1;});
child.on('exit', code => {process.exitCode = code ?? 1;});
