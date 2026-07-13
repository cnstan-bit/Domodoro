function bypassCount(day) {
  return Array.isArray(day?.bypasses) ? day.bypasses.length : Number(day?.bypassCount || 0);
}

function dailyBalanceScore(day) {
  const focusSessions = Math.max(0, Number(day?.focusSessions || 0));
  if (!focusSessions) return 0;
  const breaksCompleted = Math.max(0, Number(day?.breaksCompleted || 0));
  const focusPoints = Math.min(40, focusSessions * 10);
  const breakRatio = Math.min(1, breaksCompleted / focusSessions);
  const breakPoints = Math.round(breakRatio * 40);
  const integrityPoints = Math.max(0, 20 - bypassCount(day) * 10);
  return focusPoints + breakPoints + integrityPoints;
}

function overfocusRisk(day) {
  const focusSessions = Math.max(0, Number(day?.focusSessions || 0));
  if (!focusSessions) return 0;
  const breaksCompleted = Math.max(0, Number(day?.breaksCompleted || 0));
  const breakRatio = Math.min(1, breaksCompleted / focusSessions);
  const focusMinutes = Math.max(0, Number(day?.focusMinutes || 0));
  const longLoad = Math.max(0, focusMinutes - focusSessions * 60);
  return Math.min(100, Math.round((1 - breakRatio) * 55 + bypassCount(day) * 15 + Math.min(30, longLoad)));
}

function buildAnalytics(history, days = 30) {
  const rows = Array.isArray(days) ? days : [];
  const enrichedDays = rows.map((day) => ({
    ...day,
    balanceScore: dailyBalanceScore(day),
    overfocusRisk: overfocusRisk(day),
    bypassCount: bypassCount(day)
  }));
  const activeDays = enrichedDays.filter((day) => day.focusSessions > 0);
  const totals = enrichedDays.reduce((acc, day) => {
    acc.focusMinutes += Number(day.focusMinutes || 0);
    acc.breakMinutes += Number(day.breakMinutes || 0);
    acc.focusSessions += Number(day.focusSessions || 0);
    acc.breaksCompleted += Number(day.breaksCompleted || 0);
    acc.bypasses += Number(day.bypassCount || 0);
    return acc;
  }, { focusMinutes: 0, breakMinutes: 0, focusSessions: 0, breaksCompleted: 0, bypasses: 0 });
  const topFive = activeDays.map((day) => day.balanceScore).sort((a, b) => b - a).slice(0, 5);
  return {
    days: enrichedDays,
    totals,
    activeDays: activeDays.length,
    restCompliance: totals.focusSessions ? Math.round((totals.breaksCompleted / totals.focusSessions) * 100) : 0,
    averageBalanceScore: activeDays.length
      ? Math.round(activeDays.reduce((sum, day) => sum + day.balanceScore, 0) / activeDays.length)
      : 0,
    weeklyScore: topFive.reduce((sum, score) => sum + score, 0)
  };
}

module.exports = {
  buildAnalytics,
  dailyBalanceScore,
  overfocusRisk
};
