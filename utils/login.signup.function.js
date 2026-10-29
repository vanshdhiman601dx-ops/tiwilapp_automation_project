const onboardLocators = require('../locators/onbaord/onboard.locators');
const {wait} = require('./other.functions');
const loginSignupData = require('../test-data/login.sigup.data.json');


// Requires the Appium-backed device adapter on the first intro slide.
async function loginfun(device) {
    const options = {timeout: 10000};


    for (let i = 1; i <= 3; i++) {
        if (i < 3) {
            await device.tap(onboardLocators.nextButton, options);
            await wait(1000);
        } else {
            await device.tap(onboardLocators.continueButton, options);
        }
    }
    

    // Either missing auth control causes verification to fail with a timeout.
    await device.wait(onboardLocators.googleSignInButton, options);
    await device.wait(onboardLocators.continueWithEmailButton, options);
    await device.tap(onboardLocators.continueWithEmailButton, options);

    // The supplied frontend calls this screen Welcome Back and its button Send OTP.
    await device.wait(onboardLocators.emailScreenHeading, options);
    await device.wait(onboardLocators.emailInput, options);
    await device.wait(onboardLocators.sendOtpButton, options);
    await device.fill(onboardLocators.emailInput, loginSignupData.signup[0].email, options);
    await device.tap(onboardLocators.sendOtpButton, options);

    // An unregistered account will not reach OTP through this login path.
    await device.wait(onboardLocators.otpScreenHeading, options);
    await device.wait(onboardLocators.verifyOtpButton, options);
    const enteredOtpScreenAt = Date.now();
    let manualDeadline = enteredOtpScreenAt + 300000;
    let initialSeconds = null;
    let timerObservedAt = null;
    let countdownVerified = false;
    let filledAt = null;
    let submissionStarted = false;
    let verificationDeadline = null;

    // Inspect native controls in memory; never log or save the entered OTP.
    while (Date.now() < (verificationDeadline || manualDeadline)) {
        const hierarchy = (await device.shell('uiautomator dump /dev/tty')).toString();
        if (!hierarchy.includes('<hierarchy')) {
            throw new Error('Unable to inspect the Android screen hierarchy.');
        }
        const nodes = [];
        for (const match of hierarchy.matchAll(/<[\w.]+\b([^>]+)>/g)) {
            const node = {};
            for (const attribute of match[1].matchAll(/([\w-]+)="([^"]*)"/g)) {
                node[attribute[1]] = attribute[2]
                    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
                    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
            }
            if (node.package === onboardLocators.otpInputs.pkg) nodes.push(node);
        }
        const texts = nodes.map(node => node.text);

        if (texts.includes(onboardLocators.secondaryContactHeading.text)) {
            throw new Error('Authentication opened the secondary-contact screen instead of the requested name screen.');
        }
        if (texts.includes(onboardLocators.nameScreenHeading.text)) {
            if (!countdownVerified) {
                throw new Error('Authentication completed before the OTP countdown could be verified.');
            }
            await device.wait(onboardLocators.firstNameInput, options);
            await device.wait(onboardLocators.lastNameInput, options);
            // Export actual native authentication data, not browser storageState.
            // Android permits run-as only for a debuggable/test build.
            const fs = require('node:fs/promises');
            const path = require('node:path');
            const {execFile} = require('node:child_process');
            const {promisify} = require('node:util');
            const {DatabaseSync} = require('node:sqlite');
            const {root, sdkHome} = require('../config/android.environment');
            const {mobileConfig} = require('../config/mobile.config');
            const pkg = mobileConfig.capabilities['appium:appPackage'];
            const udid = mobileConfig.capabilities['appium:udid'];
            const adb = path.join(sdkHome, 'platform-tools', 'adb.exe');
            const execute = promisify(execFile);
            try {
                await execute(adb, ['-s', udid, 'exec-out', 'run-as', pkg, 'pwd'],
                    {timeout: 15000, windowsHide: true});
            } catch {
                throw new Error('Authenticated, but session export requires a debuggable TIWIL test build with run-as access. No users.json was written.');
            }
            const authDirectory = path.join(root, 'playwright', 'auth');
            await fs.mkdir(authDirectory, {recursive: true});
            const snapshotDirectory = await fs.mkdtemp(path.join(authDirectory, '.session-read-'));
            let database;
            try {
                const listing = await execute(adb, ['-s', udid, 'exec-out', 'run-as', pkg, 'ls', 'databases'],
                    {timeout: 15000, windowsHide: true});
                const files = listing.stdout.trim().split(/\s+/);
                if (!files.includes('RKStorage')) {
                    throw new Error('Native AsyncStorage database RKStorage is unavailable. No session was exported.');
                }
                for (const filename of ['RKStorage', 'RKStorage-wal', 'RKStorage-shm']) {
                    if (!files.includes(filename)) continue;
                    const result = await execute(adb,
                        ['-s', udid, 'exec-out', 'run-as', pkg, 'cat', `databases/${filename}`],
                        {encoding: 'buffer', timeout: 15000, windowsHide: true, maxBuffer: 32 * 1024 * 1024});
                    await fs.writeFile(path.join(snapshotDirectory, filename), result.stdout, {mode: 0o600});
                }
                database = new DatabaseSync(path.join(snapshotDirectory, 'RKStorage'));
                const rows = database.prepare(
                    'SELECT key, value FROM catalystLocalStorage WHERE key IN (?, ?)')
                    .all('authToken', 'userId');
                const credentials = Object.fromEntries(rows.map(row => [row.key, row.value]));
                if (!credentials.authToken || !credentials.userId) {
                    throw new Error('Native authToken/userId are missing. No session was exported.');
                }
                const sessionPath = path.join(authDirectory, 'users.json');
                let sessions = {version: 1, type: 'tiwil-native-auth', users: []};
                try {
                    sessions = JSON.parse(await fs.readFile(sessionPath, 'utf8'));
                } catch (error) {
                    if (error.code !== 'ENOENT') throw new Error('Existing users.json is unreadable; it was not overwritten.');
                }
                if (sessions.type !== 'tiwil-native-auth' || !Array.isArray(sessions.users)) {
                    throw new Error('Existing users.json has an unexpected format; it was not overwritten.');
                }
                const session = {appPackage: pkg, udid, userId: credentials.userId,
                    authToken: credentials.authToken, savedAt: new Date().toISOString()};
                sessions.users = sessions.users.filter(user =>
                    user.userId !== session.userId || user.appPackage !== pkg || user.udid !== udid);
                sessions.users.push(session);
                const temporaryPath = path.join(snapshotDirectory, 'users.json');
                await fs.writeFile(temporaryPath, JSON.stringify(sessions, null, 2), {mode: 0o600});
                await fs.rename(temporaryPath, sessionPath);
                return {nameScreenVerified: true, sessionFile: sessionPath};
            } finally {
                database?.close();
                // Delete only the temporary snapshot created inside this auth folder.
                if (path.dirname(path.resolve(snapshotDirectory)) === path.resolve(authDirectory)) {
                    await fs.rm(snapshotDirectory, {recursive: true, force: true});
                }
            }
        }

        if (texts.includes(onboardLocators.otpScreenHeading.text)) {
            const fields = nodes.filter(node => node.class === onboardLocators.otpInputs.clazz);
            if (fields.length !== 4) {
                throw new Error('Expected exactly four email OTP input boxes.');
            }
            const timerText = texts.find(text => onboardLocators.otpCountdown.text.test(text || ''));
            const timerMatch = timerText?.match(onboardLocators.otpCountdown.text);
            const seconds = timerMatch ? Number(timerMatch[1]) * 60 + Number(timerMatch[2]) : null;

            if (initialSeconds === null) {
                if (seconds === null || seconds <= 0 || seconds > 300) {
                    throw new Error('Expected an active countdown within the five-minute OTP window.');
                }
                initialSeconds = seconds;
                timerObservedAt = Date.now();
                manualDeadline = Math.min(manualDeadline, Date.now() + seconds * 1000);
            } else if (!countdownVerified && seconds !== null && seconds < initialSeconds) {
                const elapsed = (Date.now() - timerObservedAt) / 1000;
                if (Math.abs(initialSeconds - seconds - elapsed) > 3) {
                    throw new Error('OTP countdown is not decreasing at approximately one second per second.');
                }
                countdownVerified = true;
                console.log('OTP screen verified. Enter the four-digit OTP manually on the phone.');
            }
            if (!countdownVerified && Date.now() - timerObservedAt > 5000) {
                throw new Error('OTP countdown did not decrease.');
            }

            if (texts.includes(onboardLocators.verifyingOtpButton.text)) {
                submissionStarted = true;
                verificationDeadline ||= Date.now() + 30000;
            }
            const allFilled = fields.every(field => /^\d$/.test(field.text));
            if (allFilled && filledAt === null) filledAt = Date.now();
            if (!allFilled && !submissionStarted) filledAt = null;

            // Observe automatic verification for two seconds. At three seconds,
            // tap once only if the app has not already started verification.
            if (countdownVerified && filledAt !== null && Date.now() - filledAt >= 3000
                && !submissionStarted) {
                if (seconds === null || seconds <= 0) throw new Error('OTP expired or countdown unavailable.');
                if (!texts.includes(onboardLocators.verifyOtpButton.text)) {
                    throw new Error('Verify OTP button is unavailable.');
                }
                await device.tap(onboardLocators.verifyOtpButton, options);
                submissionStarted = true;
                verificationDeadline = Date.now() + 30000;
            }
        }
        await wait(500);
    }
    throw new Error(submissionStarted
        ? 'OTP verification did not reach the name screen within 30 seconds.'
        : 'The five-minute manual OTP entry window expired.');


    

}

module.exports = {loginfun};
