const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_SETTINGS = Object.freeze({
  timer: {
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 20,
    longBreakEvery: 4,
    selectedPresetId: 'medium',
    advancedModeEnabled: false,
    presets: {
      short: {
        focusMinutes: 20
      },
      medium: {
        focusMinutes: 40
      },
      long: {
        focusMinutes: 60
      }
    }
  },
  overlay: {
    enabledPackIds: [
      'cyber-alert',
      'boss-fight',
      'drill-sergeant',
      'deep-space',
      'countdown-court'
    ],
    fallbackPackId: 'cyber-alert',
    accentColor: '#ff3b30',
    customWarningLines: [],
    soundEnabled: false,
    intensity: 'hard',
    videoUrl: ''
  },
  controls: {
    pauseLimitPerDay: 2,
    bypassPasswordHash: ''
  },
  persona: {
    selectedPersonaId: 'discipline-officer',
    visualMode: 'dark-training-chamber',
    rewardScore: 0
  },
  app: {
    language: 'zh-CN',
    startupEnabled: false
  }
});

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(base, patch) {
  const output = Array.isArray(base) ? [...base] : { ...base };

  for (const [key, value] of Object.entries(patch || {})) {
    if (isPlainObject(value) && isPlainObject(output[key])) {
      output[key] = deepMerge(output[key], value);
    } else {
      output[key] = value;
    }
  }

  return output;
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function createSettingsStore(dataDir) {
  const settingsPath = path.join(dataDir, 'settings.json');

  return {
    path: settingsPath,
    load() {
      return deepMerge(DEFAULT_SETTINGS, readJson(settingsPath, {}));
    },
    save(partialSettings) {
      const merged = deepMerge(this.load(), partialSettings);
      writeJson(settingsPath, merged);
      return merged;
    }
  };
}

module.exports = {
  DEFAULT_SETTINGS,
  createSettingsStore,
  deepMerge
};
