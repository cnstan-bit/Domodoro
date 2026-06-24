const test = require('node:test');
const assert = require('node:assert/strict');

const { hashPassword, verifyPassword } = require('../src/core/password');

test('hashes and verifies bypass passwords without storing the raw value', () => {
  const hash = hashPassword('rest-now-123');

  assert.notEqual(hash, 'rest-now-123');
  assert.equal(verifyPassword('rest-now-123', hash), true);
  assert.equal(verifyPassword('wrong', hash), false);
});
