const { defineConfig } = require('@playwright/test');
require('./config/android.environment');

module.exports = defineConfig({
  testDir: './flows',
   use: {
    headless: false,
  },
  testMatch: '**/tests/**/*.spec.js',
  timeout: 420000,
  expect: {timeout: 10000},
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['html', {outputFolder: 'reports/html', open: 'never'}],
    ['json', {outputFile: 'reports/results.json'}],
  ],
  outputDir: 'reports/artifacts',
  preserveOutput: 'always',
  forbidOnly: Boolean(process.env.CI),
});
