const PRE_BREAK_WARNING_MS = 60 * 1000;

function shouldOpenPreBreakWarning({ phase, remainingMs, alreadyShown }) {
  return phase === 'focus'
    && !alreadyShown
    && Number(remainingMs) > 0
    && Number(remainingMs) <= PRE_BREAK_WARNING_MS;
}

function shouldResetPreBreakWarning({ phase, remainingMs }) {
  return phase !== 'focus' || Number(remainingMs) > PRE_BREAK_WARNING_MS;
}

module.exports = {
  PRE_BREAK_WARNING_MS,
  shouldOpenPreBreakWarning,
  shouldResetPreBreakWarning
};
