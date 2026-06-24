const test = require('node:test');
const assert = require('node:assert/strict');

const {
  overlayRitualForPhase,
  bypassDeniedRitual
} = require('../src/core/overlayRitual');

test('break phases use whip lock ritual', () => {
  assert.deepEqual(overlayRitualForPhase('shortBreak'), {
    name: 'whip-lock',
    durationMs: 3200,
    message: '休息命令已执行'
  });
  assert.equal(overlayRitualForPhase('longBreak').name, 'whip-lock');
});

test('decision phase skips intro ritual and bypass denial uses warning snap', () => {
  assert.equal(overlayRitualForPhase('awaitingDecision'), null);
  assert.deepEqual(bypassDeniedRitual(), {
    name: 'warning-snap',
    durationMs: 900,
    message: '违规尝试已拦截'
  });
});
