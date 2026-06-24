const fs = require('node:fs');
const path = require('node:path');

function dateKey(now) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function emptyDay(key) {
  return {
    date: key,
    focusSessions: 0,
    focusMinutes: 0,
    breaksCompleted: 0,
    breakMinutes: 0,
    pausesUsed: 0,
    bypasses: []
  };
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return { days: {} };
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function createHistoryStore(dataDir, nowProvider = () => new Date()) {
  const historyPath = path.join(dataDir, 'history.json');

  function mutateToday(mutator) {
    const history = readJson(historyPath);
    const key = dateKey(nowProvider());
    history.days[key] = history.days[key] || emptyDay(key);
    mutator(history.days[key]);
    writeJson(historyPath, history);
    return history.days[key];
  }

  return {
    path: historyPath,
    load() {
      return readJson(historyPath);
    },
    getToday() {
      const history = readJson(historyPath);
      const key = dateKey(nowProvider());
      return history.days[key] || emptyDay(key);
    },
    recordFocusComplete({ minutes }) {
      return mutateToday((today) => {
        today.focusSessions += 1;
        today.focusMinutes += Number(minutes || 0);
      });
    },
    recordBreakComplete({ minutes, packId }) {
      return mutateToday((today) => {
        today.breaksCompleted += 1;
        today.breakMinutes += Number(minutes || 0);
        today.lastBreakPackId = packId || '';
      });
    },
    recordPauseUsed({ reason }) {
      return mutateToday((today) => {
        today.pausesUsed += 1;
        today.lastPauseReason = reason || '';
      });
    },
    recordBypass({ reason, packId }) {
      return mutateToday((today) => {
        today.bypasses.push({
          at: nowProvider().toISOString(),
          reason: reason || '',
          packId: packId || ''
        });
      });
    }
  };
}

module.exports = {
  createHistoryStore,
  dateKey
};
