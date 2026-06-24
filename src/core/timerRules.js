function nextBreakKind(completedFocusSessions, longBreakEvery) {
  const interval = Math.max(1, Number(longBreakEvery || 4));
  return completedFocusSessions > 0 && completedFocusSessions % interval === 0
    ? 'longBreak'
    : 'shortBreak';
}

function canUsePause(today, settings) {
  const used = Number(today?.pausesUsed || 0);
  const limit = Number(settings?.controls?.pauseLimitPerDay ?? 0);
  return used < limit;
}

function getPreset(settings, presetId) {
  const presets = settings?.timer?.presets || {};
  return presets[presetId] || presets.medium || {
    focusMinutes: Number(settings?.timer?.focusMinutes || 25)
  };
}

function breakCompletionPhase({ bypassed }) {
  return bypassed ? 'idle' : 'awaitingDecision';
}

module.exports = {
  nextBreakKind,
  canUsePause,
  getPreset,
  breakCompletionPhase
};
