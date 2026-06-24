const test = require('node:test');
const assert = require('node:assert/strict');

const {
  shouldOpenPreBreakWarning,
  shouldResetPreBreakWarning
} = require('../src/core/preBreakWarning');

test('opens one minute warning during final focus minute only once', () => {
  assert.equal(shouldOpenPreBreakWarning({ phase: 'focus', remainingMs: 60000, alreadyShown: false }), true);
  assert.equal(shouldOpenPreBreakWarning({ phase: 'focus', remainingMs: 59000, alreadyShown: true }), false);
  assert.equal(shouldOpenPreBreakWarning({ phase: 'focus', remainingMs: 61000, alreadyShown: false }), false);
  assert.equal(shouldOpenPreBreakWarning({ phase: 'shortBreak', remainingMs: 30000, alreadyShown: false }), false);
});

test('resets warning after focus is extended above one minute', () => {
  assert.equal(shouldResetPreBreakWarning({ phase: 'focus', remainingMs: 61001 }), true);
  assert.equal(shouldResetPreBreakWarning({ phase: 'focus', remainingMs: 60000 }), false);
  assert.equal(shouldResetPreBreakWarning({ phase: 'idle', remainingMs: 0 }), true);
});
