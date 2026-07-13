function trayActionIdsForPhase(phase) {
  if (phase === 'focus') return ['snooze'];
  if (phase === 'awaitingDecision') return ['continue', 'finish', 'extend'];
  return [];
}

module.exports = { trayActionIdsForPhase };
