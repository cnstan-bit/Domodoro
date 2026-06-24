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
