const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createHistoryStore } = require('../src/core/historyStore');

test('records focus, break, pause, and bypass events for today', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'breaklock-history-'));
  const store = createHistoryStore(dir, () => new Date('2026-06-23T09:00:00+08:00'));

  store.recordFocusComplete({ minutes: 25 });
  store.recordBreakComplete({ minutes: 5, packId: 'cyber-alert' });
  store.recordPauseUsed({ reason: 'phone call' });
  store.recordBypass({ reason: 'urgent upload', packId: 'boss-fight' });

  const today = store.getToday();
  assert.equal(today.focusSessions, 1);
  assert.equal(today.breaksCompleted, 1);
  assert.equal(today.pausesUsed, 1);
  assert.equal(today.bypasses.length, 1);
  assert.equal(today.bypasses[0].reason, 'urgent upload');
});

test('migrates legacy history and records a session idempotently', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'breaklock-history-'));
  fs.writeFileSync(path.join(dir, 'history.json'), JSON.stringify({
    days: {
      '2026-06-23': { date: '2026-06-23', focusSessions: 2, focusMinutes: 50, breaksCompleted: 1, breakMinutes: 5, pausesUsed: 0, bypasses: [] }
    }
  }));
  const store = createHistoryStore(dir, () => new Date('2026-06-23T09:00:00+08:00'));

  store.recordSessionStart({ sessionId: 's1', minutes: 25 });
  store.recordFocusComplete({ sessionId: 's1', minutes: 25 });
  store.recordFocusComplete({ sessionId: 's1', minutes: 25 });
  store.recordBreakComplete({ sessionId: 's1', minutes: 5, packId: 'cyber-alert' });
  store.recordBreakComplete({ sessionId: 's1', minutes: 5, packId: 'cyber-alert' });

  const history = store.load();
  assert.equal(history.version, 2);
  assert.equal(history.days['2026-06-23'].focusSessions, 3);
  assert.equal(history.days['2026-06-23'].breaksCompleted, 2);
  assert.equal(history.sessions.length, 1);
  assert.equal(history.sessions[0].focusCompleted, true);
  assert.equal(history.sessions[0].breakCompleted, true);
});
