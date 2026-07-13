const test = require('node:test');
const assert = require('node:assert/strict');
const { trayActionIdsForPhase } = require('../src/core/trayRules');

test('tray exposes only actions relevant to the current phase', () => {
  assert.deepEqual(trayActionIdsForPhase('idle'), []);
  assert.deepEqual(trayActionIdsForPhase('focus'), ['snooze']);
  assert.deepEqual(trayActionIdsForPhase('shortBreak'), []);
  assert.deepEqual(trayActionIdsForPhase('longBreak'), []);
  assert.deepEqual(trayActionIdsForPhase('awaitingDecision'), ['continue', 'finish', 'extend']);
});
