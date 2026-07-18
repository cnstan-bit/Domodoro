const fs = require('node:fs');
const path = require('node:path');

const HISTORY_VERSION = 2;

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

function normalizeHistory(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    version: HISTORY_VERSION,
    days: source.days && typeof source.days === 'object' ? source.days : {},
    sessions: Array.isArray(source.sessions) ? source.sessions : []
  };
}

function readJson(filePath) {
  try {
    return normalizeHistory(JSON.parse(fs.readFileSync(filePath, 'utf8')));
  } catch {
    return normalizeHistory({});
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(normalizeHistory(value), null, 2)}\n`, 'utf8');
}

function createHistoryStore(dataDir, nowProvider = () => new Date()) {
  const historyPath = path.join(dataDir, 'history.json');

  function mutate(mutator) {
    const history = readJson(historyPath);
    const result = mutator(history);
    writeJson(historyPath, history);
    return result;
  }

  function ensureDay(history, key = dateKey(nowProvider())) {
    history.days[key] = { ...emptyDay(key), ...(history.days[key] || {}) };
    if (!Array.isArray(history.days[key].bypasses)) history.days[key].bypasses = [];
    return history.days[key];
  }

  function findSession(history, sessionId) {
    if (!sessionId) return null;
    return history.sessions.find((session) => session.id === sessionId) || null;
  }

  function ensureSession(history, payload = {}) {
    const sessionId = payload.sessionId || payload.id;
    if (!sessionId) return null;
    let session = findSession(history, sessionId);
    if (!session) {
      session = {
        id: sessionId,
        date: payload.date || dateKey(nowProvider()),
        startedAt: payload.startedAt || nowProvider().toISOString(),
        endedAt: null,
        presetId: payload.presetId || '',
        taskLabel: payload.taskLabel || '',
        taskCategory: payload.taskCategory || 'other',
        plannedFocusMinutes: Number(payload.plannedFocusMinutes || payload.minutes || 0),
        actualFocusMinutes: 0,
        actualBreakMinutes: 0,
        focusCompleted: false,
        breakCompleted: false,
        bypassed: false,
        pauseCount: 0,
        outcome: ''
      };
      history.sessions.push(session);
    }
    return session;
  }

  return {
    path: historyPath,
    load() {
      return readJson(historyPath);
    },
    getToday() {
      const history = readJson(historyPath);
      const key = dateKey(nowProvider());
      return { ...emptyDay(key), ...(history.days[key] || {}) };
    },
    getRange(days = 30) {
      const history = readJson(historyPath);
      const result = [];
      const today = nowProvider();
      const count = Math.max(1, Math.min(366, Number(days || 30)));
      for (let offset = count - 1; offset >= 0; offset -= 1) {
        const date = new Date(today);
        date.setHours(12, 0, 0, 0);
        date.setDate(date.getDate() - offset);
        const key = dateKey(date);
        result.push({ ...emptyDay(key), ...(history.days[key] || {}) });
      }
      return result;
    },
    recordSessionStart(payload) {
      return mutate((history) => ensureSession(history, payload));
    },
    recordFocusComplete(payload = {}) {
      return mutate((history) => {
        const session = ensureSession(history, payload);
        if (session?.focusCompleted) return ensureDay(history, session.date);
        const key = session?.date || dateKey(nowProvider());
        const today = ensureDay(history, key);
        const minutes = Number(payload.minutes || session?.plannedFocusMinutes || 0);
        today.focusSessions += 1;
        today.focusMinutes += minutes;
        if (session) {
          session.focusCompleted = true;
          session.actualFocusMinutes = minutes;
          session.endedFocusAt = payload.endedAt || nowProvider().toISOString();
        }
        return today;
      });
    },
    recordBreakComplete(payload = {}) {
      return mutate((history) => {
        const session = ensureSession(history, payload);
        if (session?.breakCompleted) return ensureDay(history, session.date);
        const key = session?.date || dateKey(nowProvider());
        const today = ensureDay(history, key);
        const minutes = Number(payload.minutes || 0);
        today.breaksCompleted += 1;
        today.breakMinutes += minutes;
        today.lastBreakPackId = payload.packId || '';
        if (session) {
          session.breakCompleted = true;
          session.actualBreakMinutes += minutes;
          session.breakPackId = payload.packId || '';
          session.endedAt = payload.endedAt || nowProvider().toISOString();
        }
        return today;
      });
    },
    recordPauseUsed(payload = {}) {
      return mutate((history) => {
        const session = ensureSession(history, payload);
        const key = session?.date || dateKey(nowProvider());
        const today = ensureDay(history, key);
        today.pausesUsed += 1;
        today.lastPauseReason = payload.reason || '';
        if (session) session.pauseCount += 1;
        return today;
      });
    },
    recordBypass(payload = {}) {
      return mutate((history) => {
        const session = ensureSession(history, payload);
        if (session?.bypassed) return ensureDay(history, session.date);
        const key = session?.date || dateKey(nowProvider());
        const today = ensureDay(history, key);
        today.bypasses.push({
          at: nowProvider().toISOString(),
          reason: payload.reason || '',
          packId: payload.packId || ''
        });
        if (session) {
          session.bypassed = true;
          session.endedAt = nowProvider().toISOString();
        }
        return today;
      });
    },
    recordOutcome({ sessionId, outcome }) {
      return mutate((history) => {
        const session = findSession(history, sessionId);
        if (session) session.outcome = String(outcome || '');
        return session;
      });
    },
    recordSessionInterrupted({ sessionId, reason = 'expired-on-startup' } = {}) {
      return mutate((history) => {
        const session = findSession(history, sessionId);
        if (session && !session.endedAt) {
          session.endedAt = nowProvider().toISOString();
          session.interrupted = true;
          session.interruptionReason = String(reason || 'expired-on-startup');
        }
        return session;
      });
    }
  };
}

module.exports = {
  HISTORY_VERSION,
  createHistoryStore,
  dateKey,
  emptyDay,
  normalizeHistory
};
