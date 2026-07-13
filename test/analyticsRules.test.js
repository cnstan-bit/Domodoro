const test = require('node:test');
const assert = require('node:assert/strict');

const { buildAnalytics, dailyBalanceScore, overfocusRisk } = require('../src/core/analyticsRules');

test('balance score rewards completed focus and recovery without rewarding overwork', () => {
  assert.equal(dailyBalanceScore({ focusSessions: 0 }), 0);
  assert.equal(dailyBalanceScore({ focusSessions: 1, breaksCompleted: 1, bypasses: [] }), 70);
  assert.equal(dailyBalanceScore({ focusSessions: 4, breaksCompleted: 4, bypasses: [] }), 100);
  assert.equal(dailyBalanceScore({ focusSessions: 8, breaksCompleted: 8, bypasses: [] }), 100);
});

test('analytics reports rest compliance and caps weekly score to five active days', () => {
  const days = Array.from({ length: 7 }, (_, index) => ({
    date: `2026-07-${String(index + 1).padStart(2, '0')}`,
    focusSessions: 4,
    focusMinutes: 160,
    breaksCompleted: 4,
    breakMinutes: 20,
    bypasses: []
  }));
  const analytics = buildAnalytics({}, days);
  assert.equal(analytics.restCompliance, 100);
  assert.equal(analytics.weeklyScore, 500);
  assert.equal(analytics.averageBalanceScore, 100);
});

test('overfocus risk rises when breaks are skipped', () => {
  assert.ok(overfocusRisk({ focusSessions: 4, breaksCompleted: 0, focusMinutes: 240 }) > 50);
  assert.equal(overfocusRisk({ focusSessions: 4, breaksCompleted: 4, focusMinutes: 160 }), 0);
});
