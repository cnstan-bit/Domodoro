const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class FakeElement {
  constructor() {
    this.value = '';
    this.checked = false;
    this.disabled = false;
    this.textContent = '';
    this.classList = { toggle() {} };
    this.style = {};
    this.listeners = {};
  }

  addEventListener(type, listener) {
    this.listeners[type] = listener;
  }

  replaceChildren() {}
  append() {}
}

test('saves current form settings before starting focus', async () => {
  const form = new FakeElement();
  form.focusMinutes = { value: '7' };
  form.shortBreakMinutes = { value: '1' };
  form.longBreakMinutes = { value: '3' };
  form.longBreakEvery = { value: '2' };
  form.videoUrl = { value: '' };
  form.accentColor = { value: '#ff3b30' };
  form.intensity = { value: 'hard' };
  form.customWarningLines = { value: '' };
  form.soundEnabled = { checked: false };
  form.pauseLimitPerDay = { value: '2' };
  form.startupEnabled = { checked: false };
  form.bypassPasswordPlain = { value: '' };

  const elements = {
    '#settingsForm': form,
    '#startFocus': new FakeElement(),
    '#snoozeFocus': new FakeElement(),
    '#taskLabel': new FakeElement(),
    '#taskCategory': new FakeElement(),
    '#actionMessage': new FakeElement(),
    '#phaseLabel': new FakeElement(),
    '#timeLeft': new FakeElement(),
    '#focusSessions': new FakeElement(),
    '#breaksCompleted': new FakeElement(),
    '#pausesUsed': new FakeElement(),
    '#bypasses': new FakeElement(),
    '#packList': new FakeElement(),
    '#enableCustomVideo': new FakeElement()
  };

  const calls = [];
  const context = {
    console,
    document: {
      querySelector: (selector) => elements[selector],
      querySelectorAll: () => [],
      createElement: () => new FakeElement()
    },
    window: {
      breaklock: {
        getInit: async () => ({
          settings: {
            timer: { focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 20, longBreakEvery: 4 },
            overlay: { enabledPackIds: [], accentColor: '#ff3b30', customWarningLines: [], soundEnabled: false, intensity: 'hard', videoUrl: '' },
            controls: { pauseLimitPerDay: 2 },
            app: { startupEnabled: false }
          },
          packs: [],
          today: { focusSessions: 0, breaksCompleted: 0, pausesUsed: 0, bypasses: [] },
          state: { phase: 'idle', remainingMs: 0, isBreakActive: false }
        }),
        saveSettings: async (settings) => {
          calls.push(['saveSettings', settings.timer.focusMinutes]);
          return {
            settings,
            packs: [],
            today: { focusSessions: 0, breaksCompleted: 0, pausesUsed: 0, bypasses: [] },
            state: { phase: 'idle', remainingMs: 0, isBreakActive: false }
          };
        },
        startFocus: async () => {
          calls.push(['startFocus']);
          return { ok: true };
        },
        startPreset: async (presetId) => {
          calls.push(['startPreset', presetId]);
          return { ok: true };
        },
        snoozeFocus: async () => ({ ok: true }),
        onState: () => {}
      }
    }
  };

  vm.createContext(context);
  const rendererCode = fs.readFileSync(path.join(__dirname, '../src/renderer/renderer.js'), 'utf8');
  vm.runInContext(rendererCode, context);
  await Promise.resolve();

  form.focusMinutes.value = '7';
  await elements['#startFocus'].listeners.click();

  assert.deepEqual(calls, [
    ['saveSettings', 7],
    ['startPreset', 'medium']
  ]);
});

test('selects a preset, then saves settings before starting it', async () => {
  const form = new FakeElement();
  form.focusMinutes = { value: '7' };
  form.shortBreakMinutes = { value: '1' };
  form.longBreakMinutes = { value: '3' };
  form.longBreakEvery = { value: '2' };
  form.videoUrl = { value: '' };
  form.accentColor = { value: '#ff3b30' };
  form.intensity = { value: 'hard' };
  form.customWarningLines = { value: '' };
  form.soundEnabled = { checked: false };
  form.pauseLimitPerDay = { value: '2' };
  form.startupEnabled = { checked: false };
  form.bypassPasswordPlain = { value: '' };

  const elements = {
    '#settingsForm': form,
    '#startFocus': new FakeElement(),
    '#snoozeFocus': new FakeElement(),
    '#taskLabel': new FakeElement(),
    '#taskCategory': new FakeElement(),
    '#actionMessage': new FakeElement(),
    '#phaseLabel': new FakeElement(),
    '#timeLeft': new FakeElement(),
    '#focusSessions': new FakeElement(),
    '#breaksCompleted': new FakeElement(),
    '#pausesUsed': new FakeElement(),
    '#bypasses': new FakeElement(),
    '#packList': new FakeElement(),
    '#enableCustomVideo': new FakeElement()
  };

  const presetButton = new FakeElement();
  presetButton.dataset = { presetId: 'long' };
  const calls = [];
  const context = {
    console,
    document: {
      querySelector: (selector) => elements[selector],
      querySelectorAll: (selector) => selector === '[data-preset-id]' ? [presetButton] : [],
      createElement: () => new FakeElement()
    },
    window: {
      breaklock: {
        getInit: async () => ({
          settings: {
            timer: {
              focusMinutes: 25,
              shortBreakMinutes: 5,
              longBreakMinutes: 20,
              longBreakEvery: 4,
              selectedPresetId: 'medium',
              presets: {
                short: { focusMinutes: 20 },
                medium: { focusMinutes: 40 },
                long: { focusMinutes: 60 }
              }
            },
            overlay: { enabledPackIds: [], accentColor: '#ff3b30', customWarningLines: [], soundEnabled: false, intensity: 'hard', videoUrl: '' },
            controls: { pauseLimitPerDay: 2 },
            app: { startupEnabled: false }
          },
          packs: [],
          today: { focusSessions: 0, breaksCompleted: 0, pausesUsed: 0, bypasses: [] },
          state: { phase: 'idle', remainingMs: 0, isBreakActive: false }
        }),
        saveSettings: async (settings) => {
          calls.push(['saveSettings', settings.timer.selectedPresetId]);
          return {
            settings,
            packs: [],
            today: { focusSessions: 0, breaksCompleted: 0, pausesUsed: 0, bypasses: [] },
            state: { phase: 'idle', remainingMs: 0, isBreakActive: false }
          };
        },
        startFocus: async () => ({ ok: true }),
        startPreset: async (presetId) => {
          calls.push(['startPreset', presetId]);
          return { ok: true };
        },
        snoozeFocus: async () => ({ ok: true }),
        continueAfterBreak: async () => ({ ok: true }),
        finishDay: async () => ({ ok: true }),
        extendBreak: async () => ({ ok: true }),
        onState: () => {}
      }
    }
  };

  vm.createContext(context);
  const rendererCode = fs.readFileSync(path.join(__dirname, '../src/renderer/renderer.js'), 'utf8');
  vm.runInContext(rendererCode, context);
  await Promise.resolve();

  await presetButton.listeners.click({ currentTarget: presetButton });

  assert.deepEqual(calls, []);
  await elements['#startFocus'].listeners.click();

  assert.deepEqual(calls, [
    ['saveSettings', 'long'],
    ['startPreset', 'long']
  ]);

  vm.runInContext("renderState({ phase: 'focus', remainingMs: 60000, focusMinutes: 20, isBreakActive: false, isDecisionActive: false, personaStage: { mode: 'training', label: 'Training' }, persona: { assets: { training: 'discipline-officer-training.png' } } })", context);
  assert.equal(presetButton.disabled, true);
  assert.equal(elements['#taskLabel'].disabled, true);
  assert.equal(elements['#taskCategory'].disabled, true);

  vm.runInContext("renderState({ phase: 'idle', remainingMs: 0, isBreakActive: false, isDecisionActive: false, personaStage: { mode: 'standby', label: 'Standby' }, persona: { assets: { standby: 'discipline-officer.png' } } })", context);
  assert.equal(presetButton.disabled, false);
  assert.equal(elements['#taskLabel'].disabled, false);
  assert.equal(elements['#taskCategory'].disabled, false);
});
