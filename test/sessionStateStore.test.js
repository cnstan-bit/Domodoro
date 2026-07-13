const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createSessionStateStore } = require('../src/core/sessionStateStore');

test('persists and clears active timer state', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'domodoro-session-'));
  const store = createSessionStateStore(dir);
  store.save({ phase: 'focus', endsAt: 123, sessionId: 'session-1' });
  assert.deepEqual(store.load(), { phase: 'focus', endsAt: 123, sessionId: 'session-1' });
  store.clear();
  assert.equal(store.load(), null);
});
