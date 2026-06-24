const WHIP_LOCK_RITUAL = Object.freeze({
  name: 'whip-lock',
  durationMs: 3200,
  message: '休息命令已执行'
});

const WARNING_SNAP_RITUAL = Object.freeze({
  name: 'warning-snap',
  durationMs: 900,
  message: '违规尝试已拦截'
});

function overlayRitualForPhase(phase) {
  if (phase === 'shortBreak' || phase === 'longBreak') return WHIP_LOCK_RITUAL;
  return null;
}

function bypassDeniedRitual() {
  return WARNING_SNAP_RITUAL;
}

module.exports = {
  bypassDeniedRitual,
  overlayRitualForPhase
};
