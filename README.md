# TIWIL Android automation

Language: JavaScript (CommonJS). Runner: Playwright Test 1.63.0.
Native driver: Appium 3.8.0 + UiAutomator2 8.7.0, using WebdriverIO 10.1.0 as its client.

## Commands

Run from this directory. Use npm.cmd in PowerShell; no execution-policy change is required.

- npm.cmd run android:devices - list phones using the same SDK ADB as Appium.
- npm.cmd run android:doctor - validate Appium prerequisites with project-local environment settings.
- npm.cmd run appium:start - start the installed Appium server on localhost:4723; keep this terminal running.
- npm.cmd run android:verify - create a native session, launch TIWIL and read its hierarchy, then close the driver session. Does not run login or send OTP.
- npm.cmd run test:list - discover tests without running them.
- npm.cmd run test:onboard - run onboarding; this sends email OTP and requires manual input on the phone.
- npm.cmd run report - view the HTML report.

## Configuration

.env configures the UDID, model, package, activity and Appium endpoint. See .env.example.
config/android.environment.js locates existing Android Studio Java and Android SDK installations and configures environment variables only for the current Node process and its children. Windows user/system variables are not changed.
config/mobile.config.js contains native Appium capabilities and command timeouts. Installed TIWIL is used: no APK download or application rebuild is needed.
playwright.config.js discovers flows/**/tests/**/*.spec.js, uses one worker, disables retries, and allows seven minutes per test for the manual OTP period.
The additional Playwright config files inherit the base config.

## Native integration

fixtures/android.fixture.js creates and closes Appium sessions.
helpers/android-device.js maps the existing device.wait/tap/fill calls to Appium commands, preserving the single loginfun(device) function.
The flow's hierarchy request maps to Appium getPageSource; arbitrary mobile shell commands are not enabled.
Playwright's browser page/context fixtures and experimental Android driver are not used by this flow. No desktop browsers are required.

## Reports and logs

- reports/html: HTML report.
- reports/results.json: JSON results.
- reports/artifacts: per-test lifecycle summary and failure screenshot attachments.
- logs/appium.log: Appium warning/error log when started with the project command.
Native screenshots use Appium; Playwright browser screenshots/video/tracing do not capture this driver.
OTP values and native page source are not deliberately written to logs. Failure screenshots may show the current application screen.

## State and prerequisites

The phone must be unlocked, USB debugging authorized, and TIWIL installed.
noReset=true, fullReset=false and shouldTerminateApp=false preserve app data/session and leave the app open. No browser storageState file is used for native login.
The onboarding test requires the first introduction slide as its starting state. It does not clear app data or log out an existing user automatically.
The flow follows the supplied frontend labels. It stops on unexpected routes such as the secondary-contact screen; installed-build locator matching still requires runtime validation.
Splash navigation now uses three iterations: Next, Next, Continue, selected by accessibility descriptions rather than displayed text. The native splash button has no resource-id. Old slide-heading waits have been removed.
After OTP/name-screen verification, loginfun exports the native authToken and userId to playwright/auth/users.json. Export requires run-as access to a debuggable TIWIL build and its RKStorage AsyncStorage database; inaccessible storage fails explicitly without creating a dummy session. This is a native token file, not Playwright browser storageState. Automatic session restore is not implemented. The entire playwright/auth directory is Git-ignored.
Appium may install/update its supporting Android driver APKs during session creation.

## Existing host

Node 24.18.0, npm 11.16.0; Android Studio bundled Java 25.0.3; SDK Build Tools 36.0.0.
Current configured phone: LG H930, Android 9, serial LGH930d179a34a. Device selection is read from .env; update ANDROID_UDID and ANDROID_DEVICE_NAME when changing phones.
TIWIL: com.tiwil/.MainActivity.
Windows 10 is outside the current Playwright documented Windows support baseline. Local discovery/setup checks do not establish full platform support.
No frontend/backend application code has been modified.

## Setup verification status

Appium doctor passed with zero required fixes. Test discovery and JavaScript syntax checks passed.
A real UiAutomator2 session launched TIWIL and read its native hierarchy successfully.
Earlier verification encountered USB reconnects and authorization prompts. After the phone was reconnected and authorized, the final android:verify check passed: session creation, TIWIL foreground package/activity, native hierarchy, a unique native element wait, and screenshot capture.
The hierarchy reader supports Appium's class-named XML tags as well as ADB node tags.
The full email/OTP flow has not been executed; its screen-specific locators remain unverified against the installed build.
