const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createSettingsStore, DEFAULT_SETTINGS } = require('../src/core/settingsStore');

test('loads default settings when settings file is missing', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'breaklock-settings-'));
  const store = createSettingsStore(dir);

  assert.deepEqual(store.load().timer, DEFAULT_SETTINGS.timer);
  assert.equal(store.load().overlay.fallbackPackId, 'cyber-alert');
});

test('default settings include the three trainer presets', () => {
  assert.equal(DEFAULT_SETTINGS.timer.selectedPresetId, 'medium');
  assert.equal(DEFAULT_SETTINGS.timer.presets.short.focusMinutes, 20);
  assert.equal(DEFAULT_SETTINGS.timer.presets.medium.focusMinutes, 40);
  assert.equal(DEFAULT_SETTINGS.timer.presets.long.focusMinutes, 60);
  assert.equal(DEFAULT_SETTINGS.timer.advancedModeEnabled, false);
});

test('default settings include the discipline officer persona interface', () => {
  assert.equal(DEFAULT_SETTINGS.persona.selectedPersonaId, 'discipline-officer');
  assert.equal(DEFAULT_SETTINGS.persona.visualMode, 'dark-training-chamber');
  assert.equal(DEFAULT_SETTINGS.persona.rewardScore, 0);
});

test('default settings include interface language', () => {
  assert.equal(DEFAULT_SETTINGS.app.language, 'zh-CN');
  assert.equal(DEFAULT_SETTINGS.app.onboardingComplete, false);
  assert.equal(DEFAULT_SETTINGS.persona.personaMode, 'safe');
  assert.equal(DEFAULT_SETTINGS.analytics.dailyFocusGoalMinutes, 160);
  assert.equal(DEFAULT_SETTINGS.social.syncSummaries, true);
});

test('saves partial settings while preserving defaults', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'breaklock-settings-'));
  const store = createSettingsStore(dir);

  store.save({ timer: { focusMinutes: 45 }, overlay: { soundEnabled: false } });
  const loaded = store.load();

  assert.equal(loaded.timer.focusMinutes, 45);
  assert.equal(loaded.timer.shortBreakMinutes, DEFAULT_SETTINGS.timer.shortBreakMinutes);
  assert.equal(loaded.overlay.soundEnabled, false);
});
