const BREAK_REWARD_POINTS = 15;

const ranks = Object.freeze([
  { key: 'coldStart', min: 0, label: '冷启动', nextAt: 60 },
  { key: 'obedience1', min: 60, label: '服从 I', nextAt: 160 },
  { key: 'obedience2', min: 160, label: '服从 II', nextAt: 320 },
  { key: 'ironRule', min: 320, label: '铁律', nextAt: 520 },
  { key: 'blackGold', min: 520, label: '黑金纪律', nextAt: null }
]);

function clampScore(value) {
  return Math.max(0, Number(value || 0));
}

function rankForScore(score) {
  const safeScore = clampScore(score);
  return [...ranks].reverse().find((rank) => safeScore >= rank.min) || ranks[0];
}

function progressForRank(score) {
  const safeScore = clampScore(score);
  const rank = rankForScore(safeScore);
  if (!rank.nextAt) return 100;
  return Math.round(((safeScore - rank.min) / (rank.nextAt - rank.min)) * 100);
}

function buildDisciplineProfile(settings, today) {
  const score = clampScore(settings?.persona?.rewardScore);
  const rank = rankForScore(score);
  return {
    score,
    rank: rank.label,
    rankKey: rank.key,
    rewardProgress: progressForRank(score),
    instability: today?.bypasses?.length || 0,
    completedBreaks: today?.breaksCompleted || 0
  };
}

module.exports = {
  BREAK_REWARD_POINTS,
  buildDisciplineProfile,
  progressForRank,
  rankForScore
};
