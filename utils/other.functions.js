const fs = require('node:fs');
const path = require('node:path');

/** Pause execution for the specified number of milliseconds. */
function wait(milliseconds) {
  if (!Number.isFinite(milliseconds) || milliseconds < 0 || milliseconds > 2147483647) {
    throw new RangeError('Wait duration must be between 0 and 2147483647 milliseconds.');
  }

  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

/** Append a parsed API response to logs/responses.json. */
function logApiResponse(apiName, response, statusCode = null) {
  if (typeof apiName !== 'string' || !apiName.trim()) {
    throw new TypeError('API name is required.');
  }
  if (response === undefined) {
    throw new TypeError('Pass the parsed API response body.');
  }

  const filePath = path.join(__dirname, '..', 'logs', 'responses.json');
  fs.mkdirSync(path.dirname(filePath), {recursive: true});
  const responses = fs.existsSync(filePath)
    ? JSON.parse(fs.readFileSync(filePath, 'utf8'))
    : [];
  if (!Array.isArray(responses)) {
    throw new TypeError('responses.json must contain a JSON array.');
  }

  // Do not write authentication secrets or common personal-data fields to logs.
  const safeResponse = JSON.parse(JSON.stringify(response, (key, value) =>
    /token|password|otp|authorization|cookie|email|phone|phoneno/i.test(key)
      ? '[REDACTED]'
      : value));
  const entry = {
    timestamp: new Date().toISOString(),
    apiName: apiName.trim(),
    statusCode,
    response: safeResponse,
  };
  responses.push(entry);
  fs.writeFileSync(filePath, JSON.stringify(responses, null, 2) + '\n', 'utf8');
  return entry;
}

module.exports = {wait, logApiResponse};
