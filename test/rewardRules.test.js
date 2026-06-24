const test = require('node:test');
const assert = require('node:assert/strict');

const {
  BREAK_REWARD_POINTS,
  buildDisciplineProfile,
  progressForRank,
  rankForScore
} = require('../src/core/rewardRules');

test('discipline profile derives rank and progress from persona reward score', () => {
  const profile = buildDisciplineProfile(
    { persona: { rewardScore: BREAK_REWARD_POINTS * 5 } },
    { breaksCompleted: 2, bypasses: [{}] }
  );

  assert.equal(profile.score, 75);
  assert.equal(profile.rank, '服从 I');
  assert.equal(profile.completedBreaks, 2);
  assert.equal(profile.instability, 1);
  assert.equal(progressForRank(75) > 0, true);
});

test('rank falls back safely when score is missing', () => {
  assert.equal(rankForScore(undefined).label, '冷启动');
});
