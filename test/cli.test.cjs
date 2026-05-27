const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const apiModule = require('../dist/api.js');
const configModule = require('../dist/config.js');

test('sanitizeApiErrorBody extracts message from JSON responses', () => {
  const body = JSON.stringify({
    statusCode: 400,
    message: ['integration is required'],
    error: 'Bad Request',
  });

  assert.equal(apiModule.sanitizeApiErrorBody(body), 'integration is required');
});

test('sanitizeApiErrorBody truncates long plaintext responses', () => {
  const longBody = 'x'.repeat(400);
  const sanitized = apiModule.sanitizeApiErrorBody(longBody);

  assert.equal(sanitized.length, 240);
  assert.match(sanitized, /\.\.\.$/);
});

test('shouldRetryRequest only retries retry-safe requests', () => {
  assert.equal(apiModule.shouldRetryRequest('GET', 503), true);
  assert.equal(apiModule.shouldRetryRequest('POST', 503), false);
  assert.equal(apiModule.shouldRetryRequest('GET', undefined, new Error('socket hang up')), true);
});

test('getConfig reads env vars and optional overrides', () => {
  process.env.FLOCKPOSTER_API_KEY = 'test-key';
  process.env.FLOCKPOSTER_API_URL = 'https://example.com/api';
  process.env.FLOCKPOSTER_TIMEOUT_MS = '45000';
  process.env.FLOCKPOSTER_VERBOSE = 'true';

  const config = configModule.getConfig();
  assert.equal(config.apiKey, 'test-key');
  assert.equal(config.apiUrl, 'https://example.com/api');
  assert.equal(config.timeoutMs, 45000);
  assert.equal(config.verbose, true);

  const overridden = configModule.getConfig({ timeout: 5000, verbose: false });
  assert.equal(overridden.timeoutMs, 5000);
  assert.equal(overridden.verbose, false);
});

test('compiled CLI help includes production flags', () => {
  const cliPath = path.join(__dirname, '..', 'dist', 'index.js');
  const result = spawnSync('node', [cliPath, '--help'], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /--timeout/);
  assert.match(result.stdout, /--verbose/);
  assert.match(result.stdout, /FLOCKPOSTER_TIMEOUT_MS/);
});
