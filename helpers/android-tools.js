const {sdkHome} = require('../config/android.environment');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

const result = spawnSync(path.join(sdkHome, 'platform-tools', 'adb.exe'), process.argv.slice(2), {
  stdio: 'inherit', windowsHide: true, timeout: 30000,
});
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
