const RESUMABLE_PHASES = new Set(['shortBreak', 'longBreak']);

function planStartupRecovery(savedState, now = Date.now()) {
  if (!savedState || typeof savedState !== 'object') {
    return { action: 'idle', state: null, reason: 'missing-state' };
  }

  const phase = String(savedState.phase || '');
  if (phase === 'awaitingDecision') {
    return { action: 'resume', state: savedState, reason: 'awaiting-decision' };
  }

  if (phase === 'focus') {
    return {
      action: 'discard',
      state: null,
      reason: 'app-restarted-during-focus',
      sessionId: savedState.sessionId || null
    };
  }

  if (!RESUMABLE_PHASES.has(phase)) {
    return { action: 'idle', state: null, reason: 'invalid-phase' };
  }

  const endsAt = Number(savedState.endsAt);
  if (!Number.isFinite(endsAt) || endsAt <= now) {
    return {
      action: 'discard',
      state: null,
      reason: 'expired-break',
      sessionId: savedState.sessionId || null
    };
  }

  return { action: 'resume', state: savedState, reason: 'active-timer' };
}

module.exports = { planStartupRecovery };
