const test = require('node:test');
const assert = require('node:assert/strict');

const {
  nextBreakKind,
  canUsePause,
  getPreset,
  breakCompletionPhase
} = require('../src/core/timerRules');

test('uses long break after the configured focus interval', () => {
  assert.equal(nextBreakKind(1, 4), 'shortBreak');
  assert.equal(nextBreakKind(4, 4), 'longBreak');
});

test('blocks pause when the daily pause limit is reached', () => {
  assert.equal(canUsePause({ pausesUsed: 1 }, { controls: { pauseLimitPerDay: 2 } }), true);
  assert.equal(canUsePause({ pausesUsed: 2 }, { controls: { pauseLimitPerDay: 2 } }), false);
});

test('reads focus minutes from short, medium, and long presets', () => {
  const settings = {
    timer: {
      presets: {
        short: { focusMinutes: 20 },
        medium: { focusMinutes: 40 },
        long: { focusMinutes: 60 }
      }
    }
  };

  assert.equal(getPreset(settings, 'short').focusMinutes, 20);
  assert.equal(getPreset(settings, 'medium').focusMinutes, 40);
  assert.equal(getPreset(settings, 'long').focusMinutes, 60);
  assert.equal(getPreset(settings, 'missing').focusMinutes, 40);
});

test('completed breaks move to awaiting decision instead of idle', () => {
  assert.equal(breakCompletionPhase({ bypassed: false }), 'awaitingDecision');
  assert.equal(breakCompletionPhase({ bypassed: true }), 'idle');
});
