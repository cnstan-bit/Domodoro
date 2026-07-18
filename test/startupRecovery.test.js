const test = require('node:test');
const assert = require('node:assert/strict');

const { planStartupRecovery } = require('../src/core/startupRecovery');

test('discards a focus timer even when it still has time remaining', () => {
  const state = { phase: 'focus', endsAt: 2_000, sessionId: 'active' };
  assert.deepEqual(planStartupRecovery(state, 1_000), {
    action: 'discard',
    state: null,
    reason: 'app-restarted-during-focus',
    sessionId: 'active'
  });
});

test('discards an expired focus without starting a forced break', () => {
  assert.deepEqual(
    planStartupRecovery({ phase: 'focus', endsAt: 999, sessionId: 'stale' }, 1_000),
    {
      action: 'discard',
      state: null,
      reason: 'app-restarted-during-focus',
      sessionId: 'stale'
    }
  );
});

test('resumes only active breaks and preserves the decision screen', () => {
  const activeBreak = { phase: 'shortBreak', endsAt: 2_000 };
  assert.equal(planStartupRecovery(activeBreak, 1_000).action, 'resume');
  assert.equal(planStartupRecovery({ phase: 'shortBreak', endsAt: 999 }, 1_000).reason, 'expired-break');
  assert.equal(planStartupRecovery({ phase: 'awaitingDecision', endsAt: null }, 1_000).action, 'resume');
});
