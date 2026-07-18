let appData;
let latestState;
let selectedPresetId = 'medium';
let analyticsRange = 7;
let historyChart;
let socialState;

const personaAssetBase = '../assets/personas/';
const uiText = {
  'zh-CN': {
    navFocus: '专注', navInsights: '分析', navSquad: '小队', navArmory: '装备室',
    taskLabel: '这轮完成什么？', taskCategory: '类型', start: '开始专注', extend: '延长 5 分钟',
    statusStandby: '训练舱待命', disciplineStamp: '纪律', taskPlaceholder: '例如：完成提案第一版',
    categoryWork: '工作', categoryStudy: '学习', categoryCreative: '创作', categoryAdmin: '杂务', categoryOther: '其他',
    today: '今日状态', balanceScore: '专注与恢复平衡分', focusSessions: '完成轮次', restCompliance: '休息完成率',
    breaksCompleted: '完成休息', bypasses: '紧急绕过', nextReward: '下一角色档案', viewInsights: '查看完整分析',
    insightsTitle: '专注与恢复分析', insightsSubtitle: '看清什么时候效率最高，也看清什么时候该停。',
    focusTime: '专注时间', averageBalance: '平均平衡分', overfocusRisk: '过度专注风险', trend: '每日趋势',
    trendHint: '红色：专注分钟 · 绿色：休息完成率', weeklyScore: '本周平衡积分', coachSignal: '本周信号',
    recentDays: '最近记录', privateLocal: '详细任务仅保存在本机', squadTitle: '小队纪律榜',
    squadSubtitle: '比较平衡分，不比较谁熬得更久。', privacyFirst: '隐私优先', squadIntroTitle: '小队功能已准备好接入',
    squadIntroBody: '登录后可加入最多 12 人的小队。只同步每日汇总，不上传任务名称或绕过原因。',
    connectCloud: '连接 Supabase', shareCard: '生成本周分享卡', yourWeeklyScore: '你的本周平衡分',
    scoreRule: '取本周最高 5 个有效日，避免用过劳换排名。', localFirst: '本地优先',
    localFirstBody: '不登录也能使用全部计时、遮罩和个人分析。', smallSquad: '小队而非广场',
    smallSquadBody: '没有公开动态和陌生人私信，降低干扰与审核风险。', healthyRank: '健康排名',
    healthyRankBody: '休息完成率与无绕过记录和专注轮次同样重要。', armoryTitle: '装备室',
    armorySubtitle: '套餐、遮罩、角色与约束集中管理。', save: '保存设置', timerSettings: '计时套餐',
    timerSettingsHint: '为不同精力状态准备三档节奏。', advancedTimer: '高级计时参数', overlayEngine: '遮罩引擎',
    overlayHint: '选择休息时随机出现的强制恢复场景。', personaRules: '角色与约束',
    personaHint: '默认模式适合公开场景，成人角色需要主动开启。',
    email: '邮箱', sendCode: '发送验证码', verificationCode: '验证码', signIn: '登录', createSquadLabel: '创建小队',
    create: '创建', inviteCode: '邀请码', join: '加入', signOut: '退出云端账号', squadNamePlaceholder: '专注恢复小队', invitePlaceholder: '8 位邀请码',
    presetShortMinutes: '短训分钟', presetMediumMinutes: '标准分钟', presetLongMinutes: '深度分钟', dailyGoal: '每日专注目标',
    manualFocusMinutes: '手动专注分钟', shortBreakMinutes: '短休分钟', longBreakMinutes: '长休分钟', longBreakEvery: '长休间隔',
    customVideo: '启用自定义视频遮罩', videoUrl: '视频直链', intensity: '遮罩强度', intensityHard: '强', intensityNormal: '标准', intensityLight: '轻',
    accentColor: '主色', soundEnabled: '启用音效', customWarnings: '自定义警告语', warningPlaceholder: '每行一句',
    interfaceLanguage: '界面语言', personaMode: '角色模式', safePersona: '赛博纪律官', adultPersona: '成人角色包', visualMode: '视觉模式',
    darkChamber: '暗黑训练舱', redAlertHud: '红色警戒 HUD', pauseLimit: '每日暂停/延长上限', bypassPassword: '设置/更新绕过密码',
    bypassPlaceholder: '留空则不修改', workdayEnd: '下班提醒时间', reduceMotion: '减少动态效果', startup: '开机自动启动', syncSummaries: '登录后同步每日汇总',
    onboardingTitle: '你不是需要更拼命，你需要准时停下。', onboardingBody: '选择一套节奏。专注结束前一分钟会提醒，时间到后进入强制恢复。',
    defaultIntensity: '默认强度', normalConstraint: '标准约束', hardConstraint: '强制约束', lightConstraint: '温和提醒',
    adultConfirm: '我已年满 18 岁，并主动启用成人视觉包', privateOnboarding: '所有详细记录默认只保存在本机。', enterCommand: '进入纪律中枢'
  },
  'en-US': {
    navFocus: 'Focus', navInsights: 'Insights', navSquad: 'Squad', navArmory: 'Armory',
    taskLabel: 'What will you finish?', taskCategory: 'Type', start: 'Start focus', extend: 'Add 5 minutes',
    statusStandby: 'CHAMBER STANDING BY', disciplineStamp: 'DISCIPLINE', taskPlaceholder: 'Example: Finish proposal draft',
    categoryWork: 'Work', categoryStudy: 'Study', categoryCreative: 'Creative', categoryAdmin: 'Admin', categoryOther: 'Other',
    today: 'Today', balanceScore: 'Focus and recovery balance', focusSessions: 'Sessions', restCompliance: 'Break compliance',
    breaksCompleted: 'Breaks', bypasses: 'Bypasses', nextReward: 'Next persona file', viewInsights: 'View full insights',
    insightsTitle: 'Focus and recovery insights', insightsSubtitle: 'See when you work best and when you need to stop.',
    focusTime: 'Focus time', averageBalance: 'Average balance', overfocusRisk: 'Overfocus risk', trend: 'Daily trend',
    trendHint: 'Red: focus minutes · Green: break compliance', weeklyScore: 'Weekly balance score', coachSignal: 'Weekly signal',
    recentDays: 'Recent days', privateLocal: 'Detailed tasks stay on this device', squadTitle: 'Squad discipline board',
    squadSubtitle: 'Compete on balance, not exhaustion.', privacyFirst: 'PRIVACY FIRST', squadIntroTitle: 'Squad connection is ready',
    squadIntroBody: 'Sign in to join a squad of up to 12 people. Only daily summaries sync; task names and bypass reasons stay local.',
    connectCloud: 'Connect Supabase', shareCard: 'Create weekly card', yourWeeklyScore: 'Your weekly balance',
    scoreRule: 'Uses your five strongest active days so overwork cannot buy rank.', localFirst: 'Local first',
    localFirstBody: 'Timer, overlays, and personal insights work without an account.', smallSquad: 'Squads, not feeds',
    smallSquadBody: 'No public feed or stranger messages, reducing distraction and moderation risk.', healthyRank: 'Healthy ranking',
    healthyRankBody: 'Break compliance and avoiding bypasses matter as much as completing focus sessions.', armoryTitle: 'Armory',
    armorySubtitle: 'Manage presets, overlays, personas, and limits.', save: 'Save settings', timerSettings: 'Timer presets',
    timerSettingsHint: 'Keep three rhythms ready for different energy levels.', advancedTimer: 'Advanced timer values', overlayEngine: 'Overlay engine',
    overlayHint: 'Choose the forced recovery scenes used during breaks.', personaRules: 'Persona and limits',
    personaHint: 'The public-safe persona is default. Adult visuals require opt-in.',
    email: 'Email', sendCode: 'Send code', verificationCode: 'Code', signIn: 'Sign in', createSquadLabel: 'Create squad',
    create: 'Create', inviteCode: 'Invite code', join: 'Join', signOut: 'Sign out', squadNamePlaceholder: 'Recovery squad', invitePlaceholder: '8-character code',
    presetShortMinutes: 'Short minutes', presetMediumMinutes: 'Standard minutes', presetLongMinutes: 'Deep minutes', dailyGoal: 'Daily focus goal',
    manualFocusMinutes: 'Manual focus minutes', shortBreakMinutes: 'Short break', longBreakMinutes: 'Long break', longBreakEvery: 'Long break interval',
    customVideo: 'Enable custom video overlay', videoUrl: 'Video direct URL', intensity: 'Overlay intensity', intensityHard: 'Hard', intensityNormal: 'Normal', intensityLight: 'Light',
    accentColor: 'Accent color', soundEnabled: 'Enable sound', customWarnings: 'Custom warning lines', warningPlaceholder: 'One line each',
    interfaceLanguage: 'Interface language', personaMode: 'Persona mode', safePersona: 'Cyber Officer', adultPersona: 'Adult persona pack', visualMode: 'Visual mode',
    darkChamber: 'Dark training chamber', redAlertHud: 'Red alert HUD', pauseLimit: 'Daily pause/extend limit', bypassPassword: 'Set/update bypass password',
    bypassPlaceholder: 'Leave blank to keep current', workdayEnd: 'Workday end hour', reduceMotion: 'Reduce motion', startup: 'Launch at startup', syncSummaries: 'Sync daily summaries after sign-in',
    onboardingTitle: 'You do not need to push harder. You need to stop on time.', onboardingBody: 'Choose a rhythm. You will get a one-minute warning before forced recovery begins.',
    defaultIntensity: 'Default intensity', normalConstraint: 'Standard', hardConstraint: 'Strict', lightConstraint: 'Light',
    adultConfirm: 'I am 18 or older and choose to enable the adult visual pack', privateOnboarding: 'Detailed records stay on this device by default.', enterCommand: 'Enter command center'
  }
};

function $(selector) { return document.querySelector(selector); }
function $all(selector) { return Array.from(document.querySelectorAll(selector) || []); }
function setText(selector, value) { const node = $(selector); if (node) node.textContent = value ?? ''; }
function getCopy() { return appData?.copy || {}; }
function personaLines() { return appData?.personaLines || getCopy().personaLines || {}; }
function currentLanguage() { return appData?.language || appData?.settings?.app?.language || 'zh-CN'; }
function isEnglish() { return currentLanguage() === 'en-US'; }
function field(form, name) { return form?.[name] || null; }
function fieldValue(form, name, fallback = '') { const node = field(form, name); return node && node.value !== '' ? node.value : fallback; }
function numberValue(form, name, fallback) { const value = Number(fieldValue(form, name, fallback)); return Number.isFinite(value) ? value : fallback; }
function checkedValue(form, name, fallback = false) { const node = field(form, name); return node ? Boolean(node.checked) : fallback; }

function minutesSeconds(ms) {
  const total = Math.max(0, Math.ceil(Number(ms || 0) / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function applyInterfaceCopy() {
  const text = uiText[currentLanguage()] || uiText['zh-CN'];
  $all('[data-ui]').forEach((node) => {
    const value = text[node.dataset.ui];
    if (value) node.textContent = value;
  });
  $all('[data-ui-placeholder]').forEach((node) => {
    const value = text[node.dataset.uiPlaceholder];
    if (value) node.placeholder = value;
  });
  if (document.documentElement) {
    document.documentElement.lang = currentLanguage();
    document.documentElement.classList?.toggle('reduce-motion', Boolean(appData?.settings?.ui?.reduceMotion));
  }
  setText('#continueAfterBreak', personaLines().decision?.continue || (isEnglish() ? 'Continue next round' : '继续下一轮'));
  setText('#finishDay', personaLines().decision?.finish || (isEnglish() ? 'Finish today' : '今天收工'));
  setText('#extendBreak', personaLines().decision?.extend || (isEnglish() ? 'Recover 5 more minutes' : '再恢复 5 分钟'));
}

function setRoute(route) {
  const next = ['focus', 'insights', 'squad', 'armory'].includes(route) ? route : 'focus';
  $all('[data-route]').forEach((view) => view.classList?.toggle('active', view.dataset.route === next));
  $all('[data-route-target]').forEach((button) => button.classList?.toggle('active', button.dataset.routeTarget === next));
  if (next === 'insights') renderAnalytics();
  if (next === 'squad') renderSquad();
}

function personaName(persona) {
  return getCopy().personaNames?.[persona?.id] || persona?.name || (isEnglish() ? 'Discipline Officer' : '纪律调教官');
}

function renderPersona(state) {
  const persona = state?.persona || appData?.state?.persona;
  const image = $('#officerImage');
  const mode = appData?.settings?.persona?.personaMode || 'safe';
  const stageMode = state?.personaStage?.mode || 'standby';
  const asset = persona?.assets?.[stageMode]
    || persona?.assets?.standby
    || 'discipline-officer.png';
  if (image && !image.src.endsWith(asset)) image.src = `${personaAssetBase}${asset}`;
  setText('#personaName', personaName(persona));
  setText('#personaStageLabel', state?.personaStage?.label || getCopy().stageLabels?.idle || '待命');
  setText('#personaModeBadge', mode === 'adult' ? 'ADULT PERSONA' : 'CYBER OFFICER');
  const stage = $('.persona-stage');
  if (stage) stage.dataset.personaMode = mode;
}

function renderState(state) {
  if (!state) return;
  latestState = state;
  if (document.body) document.body.dataset.phase = state.phase || 'idle';
  const focusLayout = $('.focus-layout');
  if (focusLayout) focusLayout.dataset.phase = state.phase || 'idle';
  const phaseName = getCopy().phaseNames?.[state.phase] || state.phase || 'idle';
  setText('#phaseLabel', phaseName);
  setText('#headerPhase', phaseName);
  setText('#timeLeft', state.phase === 'idle' ? '--:--' : minutesSeconds(state.remainingMs));
  setText('#currentCommand', state.commandLine || personaLines().states?.idle || '');
  setText('#hudCommand', state.commandLine || personaLines().states?.idle || '');
  setText('#personaFooterLine', state?.personaStage?.label || uiText[currentLanguage()]?.statusStandby || '');
  const snooze = $('#snoozeFocus');
  if (snooze) {
    snooze.disabled = state.phase !== 'focus';
    snooze.hidden = state.phase !== 'focus';
  }
  const start = $('#startFocus');
  if (start) {
    start.disabled = state.phase !== 'idle';
    start.hidden = state.phase !== 'idle';
  }
  const decision = $('#decisionPanel');
  if (decision) decision.hidden = !state.isDecisionActive;
  const setupLocked = state.phase !== 'idle';
  $all('[data-preset-id]').forEach((button) => {
    button.disabled = setupLocked;
    button.setAttribute?.('aria-disabled', String(setupLocked));
  });
  for (const control of [$('#taskLabel'), $('#taskCategory')]) {
    if (control) control.disabled = setupLocked;
  }
  const plannedMinutes = state.phase === 'focus' ? state.focusMinutes : state.breakMinutes;
  const totalMs = Math.max(1, Number(plannedMinutes || 0) * 60 * 1000);
  const progress = state.phase === 'idle' ? 0 : Math.max(0, Math.min(100, 100 - (Number(state.remainingMs || 0) / totalMs) * 100));
  const progressNode = $('#timerProgress');
  if (progressNode) progressNode.style.width = `${progress}%`;
  renderPersona(state);
}

function renderPresetCards(settings = appData?.settings) {
  const presets = settings?.timer?.presets || {};
  const lines = personaLines().presets || {};
  selectedPresetId = settings?.timer?.selectedPresetId || selectedPresetId;
  setText('#presetShortName', getCopy().renderer?.shortPreset || (isEnglish() ? 'Short' : '短训'));
  setText('#presetMediumName', getCopy().renderer?.mediumPreset || (isEnglish() ? 'Standard' : '标准'));
  setText('#presetLongName', getCopy().renderer?.longPreset || (isEnglish() ? 'Deep' : '深度'));
  setText('#presetShortTitle', `${presets.short?.focusMinutes || 20}m`);
  setText('#presetMediumTitle', `${presets.medium?.focusMinutes || 40}m`);
  setText('#presetLongTitle', `${presets.long?.focusMinutes || 60}m`);
  setText('#presetShortLine', lines.short?.subtitle || (isEnglish() ? 'Enter quickly' : '快速进入状态'));
  setText('#presetMediumLine', lines.medium?.subtitle || (isEnglish() ? 'Steady core work' : '稳定推进核心任务'));
  setText('#presetLongLine', lines.long?.subtitle || (isEnglish() ? 'Deep work, hard stop' : '深度工作，到点停手'));
  $all('[data-preset-id]').forEach((button) => button.classList?.toggle('selected', button.dataset.presetId === selectedPresetId));
}

function renderToday() {
  const today = appData?.today || {};
  const discipline = appData?.discipline || {};
  const dayAnalytics = appData?.analytics?.days?.at?.(-1) || {};
  const focusSessions = Number(today.focusSessions || 0);
  const breaksCompleted = Number(today.breaksCompleted || 0);
  const compliance = focusSessions ? Math.round((breaksCompleted / focusSessions) * 100) : 0;
  const balance = Number(dayAnalytics.balanceScore || 0);
  setText('#disciplineRank', getCopy().ranks?.[discipline.rankKey] || discipline.rank || (isEnglish() ? 'Cold Start' : '冷启动'));
  setText('#disciplineScore', discipline.score || 0);
  setText('#focusSessions', focusSessions);
  setText('#breaksCompleted', breaksCompleted);
  setText('#pausesUsed', today.pausesUsed || 0);
  setText('#bypasses', Array.isArray(today.bypasses) ? today.bypasses.length : 0);
  setText('#todayRestCompliance', `${Math.min(100, compliance)}%`);
  setText('#todayBalance', balance);
  const balanceBar = $('#todayBalanceBar');
  if (balanceBar) balanceBar.style.width = `${balance}%`;
  const unlock = appData?.unlockPreview || {};
  setText('#unlockPersonaName', personaName(unlock));
  setText('#unlockPersonaScore', `${discipline.score || 0}/${unlock.requiredScore || 160}`);
  const unlockProgress = $('#unlockProgress');
  if (unlockProgress) unlockProgress.style.width = `${unlock.progress || 0}%`;
}

function renderPacks() {
  const container = $('#packList');
  if (!container) return;
  const enabled = new Set(appData?.settings?.overlay?.enabledPackIds || []);
  container.replaceChildren?.();
  for (const pack of appData?.packs || []) {
    if (pack.id === 'custom-video') continue;
    const label = document.createElement('label');
    label.className = 'pack';
    const packName = getCopy().packNames?.[pack.name] || pack.name;
    label.innerHTML = `<input type="checkbox" data-pack-id="${pack.id}" ${enabled.has(pack.id) ? 'checked' : ''}><span>${packName}</span><small>${pack.type}</small>`;
    container.append?.(label);
  }
}

function hydrateSettings() {
  const form = $('#settingsForm');
  const settings = appData?.settings;
  if (!form || !settings) return;
  const values = {
    focusMinutes: settings.timer.focusMinutes,
    shortBreakMinutes: settings.timer.shortBreakMinutes,
    longBreakMinutes: settings.timer.longBreakMinutes,
    longBreakEvery: settings.timer.longBreakEvery,
    presetShortMinutes: settings.timer.presets?.short?.focusMinutes || 20,
    presetMediumMinutes: settings.timer.presets?.medium?.focusMinutes || 40,
    presetLongMinutes: settings.timer.presets?.long?.focusMinutes || 60,
    dailyFocusGoalMinutes: settings.analytics?.dailyFocusGoalMinutes || 160,
    workdayEndHour: settings.analytics?.workdayEndHour ?? 20,
    videoUrl: settings.overlay.videoUrl || '',
    accentColor: settings.overlay.accentColor || '#e5484d',
    intensity: settings.overlay.intensity || 'hard',
    customWarningLines: (settings.overlay.customWarningLines || []).join('\n'),
    language: settings.app.language || 'zh-CN',
    personaMode: settings.persona?.personaMode || 'safe',
    visualMode: settings.persona?.visualMode || 'dark-training-chamber',
    pauseLimitPerDay: settings.controls.pauseLimitPerDay
  };
  Object.entries(values).forEach(([name, value]) => { if (field(form, name)) field(form, name).value = value; });
  const checks = {
    soundEnabled: settings.overlay.soundEnabled,
    startupEnabled: settings.app.startupEnabled,
    reduceMotion: settings.ui?.reduceMotion,
    syncSummaries: settings.social?.syncSummaries !== false
  };
  Object.entries(checks).forEach(([name, value]) => { if (field(form, name)) field(form, name).checked = Boolean(value); });
  const video = $('#enableCustomVideo');
  if (video) video.checked = Boolean(settings.overlay.videoUrl);
  const quickLanguage = $('#quickLanguage');
  if (quickLanguage) quickLanguage.value = settings.app.language || 'zh-CN';
}

function showOnboardingIfNeeded() {
  const dialog = $('#onboardingDialog');
  if (!dialog || appData?.settings?.app?.onboardingComplete) return;
  if (!dialog.open) dialog.showModal?.();
}

function collectSettings() {
  const form = $('#settingsForm');
  const selectedPacks = $all('[data-pack-id]:checked').map((input) => input.dataset.packId);
  const videoUrl = fieldValue(form, 'videoUrl', '');
  if (videoUrl && $('#enableCustomVideo')?.checked) selectedPacks.push('custom-video');
  return {
    timer: {
      focusMinutes: numberValue(form, 'focusMinutes', 25),
      shortBreakMinutes: numberValue(form, 'shortBreakMinutes', 5),
      longBreakMinutes: numberValue(form, 'longBreakMinutes', 20),
      longBreakEvery: numberValue(form, 'longBreakEvery', 4),
      selectedPresetId,
      presets: {
        short: { focusMinutes: numberValue(form, 'presetShortMinutes', 20) },
        medium: { focusMinutes: numberValue(form, 'presetMediumMinutes', 40) },
        long: { focusMinutes: numberValue(form, 'presetLongMinutes', 60) }
      }
    },
    overlay: {
      enabledPackIds: selectedPacks,
      videoUrl,
      accentColor: fieldValue(form, 'accentColor', '#e5484d'),
      intensity: fieldValue(form, 'intensity', 'hard'),
      customWarningLines: fieldValue(form, 'customWarningLines', '').split('\n').map((line) => line.trim()).filter(Boolean),
      soundEnabled: checkedValue(form, 'soundEnabled')
    },
    controls: {
      pauseLimitPerDay: numberValue(form, 'pauseLimitPerDay', 2),
      bypassPasswordPlain: fieldValue(form, 'bypassPasswordPlain', '')
    },
    persona: {
      personaMode: fieldValue(form, 'personaMode', 'safe'),
      visualMode: fieldValue(form, 'visualMode', 'dark-training-chamber')
    },
    ui: { reduceMotion: checkedValue(form, 'reduceMotion') },
    analytics: {
      dailyFocusGoalMinutes: numberValue(form, 'dailyFocusGoalMinutes', 160),
      workdayEndHour: numberValue(form, 'workdayEndHour', 20)
    },
    social: { syncSummaries: checkedValue(form, 'syncSummaries', true) },
    app: {
      language: fieldValue(form, 'language', $('#quickLanguage')?.value || 'zh-CN'),
      startupEnabled: checkedValue(form, 'startupEnabled')
    }
  };
}

function renderAnalytics() {
  const analytics = appData?.analytics || {};
  const rows = (analytics.days || []).slice(-analyticsRange);
  const focusMinutes = rows.reduce((sum, row) => sum + Number(row.focusMinutes || 0), 0);
  const sessions = rows.reduce((sum, row) => sum + Number(row.focusSessions || 0), 0);
  const breaks = rows.reduce((sum, row) => sum + Number(row.breaksCompleted || 0), 0);
  const active = rows.filter((row) => row.focusSessions > 0);
  const averageBalance = active.length ? Math.round(active.reduce((sum, row) => sum + Number(row.balanceScore || 0), 0) / active.length) : 0;
  const averageRisk = active.length ? Math.round(active.reduce((sum, row) => sum + Number(row.overfocusRisk || 0), 0) / active.length) : 0;
  setText('#metricFocusMinutes', `${focusMinutes}m`);
  setText('#metricCompliance', `${sessions ? Math.round((breaks / sessions) * 100) : 0}%`);
  setText('#metricBalance', averageBalance);
  setText('#metricRisk', averageRisk);
  setText('#weeklyScore', analytics.weeklyScore || 0);
  setText('#socialWeeklyScore', analytics.weeklyScore || 0);
  const scoreRule = $('.score-rule i');
  if (scoreRule) scoreRule.style.width = `${Math.min(100, Number(analytics.weeklyScore || 0) / 5)}%`;
  const signal = averageRisk >= 55
    ? (isEnglish() ? 'Recovery is falling behind focus. Shorten the next round and complete the full break.' : '恢复正在落后于专注。下一轮缩短，并完成完整休息。')
    : sessions > 0
      ? (isEnglish() ? 'Your rhythm is balanced. Keep protecting the break, not just the focus block.' : '本周节奏平衡。继续保护休息，而不只是保护专注时间。')
      : (isEnglish() ? 'Complete one focus round to unlock a recovery signal.' : '完成第一轮专注后，这里会给出恢复建议。');
  setText('#coachSignal', signal);

  const historyNode = $('#dayHistory');
  if (historyNode) {
    historyNode.innerHTML = rows.map((row) => `<article class="day-cell"><span>${row.date.slice(5)}</span><strong>${row.balanceScore || 0}</strong><small>${row.focusMinutes || 0}m · ${row.breaksCompleted || 0}/${row.focusSessions || 0}</small></article>`).join('');
  }

  const canvas = $('#historyChart');
  if (!canvas || typeof Chart === 'undefined') return;
  historyChart?.destroy?.();
  historyChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: rows.map((row) => row.date.slice(5)),
      datasets: [
        { label: isEnglish() ? 'Focus minutes' : '专注分钟', data: rows.map((row) => row.focusMinutes || 0), backgroundColor: '#e5484d', borderRadius: 2, yAxisID: 'y' },
        { label: isEnglish() ? 'Break compliance' : '休息完成率', data: rows.map((row) => row.focusSessions ? Math.round((row.breaksCompleted / row.focusSessions) * 100) : 0), borderColor: '#4fbf9f', backgroundColor: '#4fbf9f', type: 'line', tension: 0.28, yAxisID: 'y1' }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#98a1ad', boxWidth: 10 } } },
      scales: {
        x: { ticks: { color: '#98a1ad' }, grid: { color: 'rgba(255,255,255,.05)' } },
        y: { beginAtZero: true, ticks: { color: '#98a1ad' }, grid: { color: 'rgba(255,255,255,.05)' } },
        y1: { beginAtZero: true, max: 100, position: 'right', ticks: { color: '#4fbf9f' }, grid: { drawOnChartArea: false } }
      }
    }
  });
}

function renderSquad() {
  renderAnalytics();
  const configured = Boolean(appData?.social?.configured);
  setText('#socialStatusBadge', configured ? (socialState?.authenticated ? 'CONNECTED' : 'READY') : 'LOCAL ONLY');
  const authPanel = $('#socialAuthPanel');
  const setupPanel = $('#squadSetupPanel');
  const memberPanel = $('#squadMemberPanel');
  if (authPanel) authPanel.hidden = !configured || Boolean(socialState?.authenticated);
  if (setupPanel) setupPanel.hidden = !socialState?.authenticated || Boolean(socialState?.squad);
  if (memberPanel) memberPanel.hidden = !socialState?.squad;
  if (socialState?.squad) {
    setText('#activeSquadName', socialState.squad.name);
    setText('#activeSquadCode', socialState.squad.invite_code || '');
    const members = $('#squadMembers');
    if (members) members.innerHTML = (socialState.members || []).map((member, index) => `<div class="member-row"><b>${index + 1}</b><strong>${member.display_name}</strong><span>${member.weekly_score}</span></div>`).join('');
  }
}

async function loadSocialState() {
  if (!window.breaklock.getSocialState || !appData?.social?.configured) {
    socialState = { configured: false, authenticated: false };
    renderSquad();
    return;
  }
  try {
    socialState = await window.breaklock.getSocialState();
    if (socialState.authenticated) await window.breaklock.syncToday?.();
    renderSquad();
  } catch (error) {
    setMessage(error.message, true, '#socialMessage');
  }
}

function setMessage(text, isError = false, selector = '#actionMessage') {
  const node = $(selector);
  if (!node) return;
  node.textContent = text || '';
  node.classList?.toggle('error', Boolean(isError));
}

async function refresh() {
  appData = await window.breaklock.getInit();
  setText('#appVersion', `V${appData.appVersion || '0.3.1'}`);
  selectedPresetId = appData.settings?.timer?.selectedPresetId || selectedPresetId;
  applyInterfaceCopy();
  hydrateSettings();
  renderPacks();
  renderPresetCards();
  renderToday();
  renderState(appData.state);
  renderAnalytics();
  loadSocialState();
  showOnboardingIfNeeded();
  if (typeof lucide !== 'undefined') lucide.createIcons({ attrs: { 'stroke-width': 1.8 } });
}

async function saveSettings() {
  appData = await window.breaklock.saveSettings(collectSettings());
  applyInterfaceCopy();
  hydrateSettings();
  renderPacks();
  renderPresetCards();
  renderToday();
  setMessage(personaLines().feedback?.saved || (isEnglish() ? 'Settings saved.' : '设置已保存。'), false, '#settingsMessage');
}

async function startSelectedPreset() {
  const presetId = selectedPresetId;
  appData = await window.breaklock.saveSettings(collectSettings());
  const context = {
    taskLabel: $('#taskLabel')?.value || '',
    taskCategory: $('#taskCategory')?.value || 'other'
  };
  const result = await window.breaklock.startPreset(presetId, context);
  setMessage(result.ok ? personaLines().feedback?.started || (isEnglish() ? 'Focus started.' : '专注开始。') : result.error, !result.ok);
  if (result.state) renderState(result.state);
}

$all('[data-route-target]').forEach((button) => button.addEventListener('click', () => setRoute(button.dataset.routeTarget)));
$all('[data-preset-id]').forEach((button) => button.addEventListener('click', () => {
  selectedPresetId = button.dataset.presetId;
  $all('[data-preset-id]').forEach((item) => item.classList?.toggle('selected', item === button));
}));
$all('[data-range]').forEach((button) => button.addEventListener('click', async () => {
  analyticsRange = Number(button.dataset.range || 7);
  $all('[data-range]').forEach((item) => item.classList?.toggle('active', item === button));
  appData.analytics = await window.breaklock.getAnalytics(analyticsRange);
  renderAnalytics();
}));

$('#startFocus')?.addEventListener('click', startSelectedPreset);
$('#snoozeFocus')?.addEventListener('click', async () => {
  const result = await window.breaklock.snoozeFocus();
  setMessage(result.ok ? (isEnglish() ? 'Five minutes added.' : '已延长 5 分钟。') : result.error, !result.ok);
});
$('#continueAfterBreak')?.addEventListener('click', async () => {
  const result = await window.breaklock.continueAfterBreak();
  setMessage(result.ok ? personaLines().feedback?.started || '训练开始。' : result.error, !result.ok);
});
$('#finishDay')?.addEventListener('click', async () => {
  const result = await window.breaklock.finishDay();
  setMessage(result.ok ? personaLines().feedback?.finished || '今天到此为止。' : result.error, !result.ok);
});
$('#extendBreak')?.addEventListener('click', async () => {
  const result = await window.breaklock.extendBreak();
  setMessage(result.ok ? personaLines().feedback?.extended || '再恢复 5 分钟。' : result.error, !result.ok);
});
$('#settingsForm')?.addEventListener('submit', async (event) => { event.preventDefault(); await saveSettings(); });
$('#saveSettingsTop')?.addEventListener('click', saveSettings);
$('#socialConnect')?.addEventListener('click', () => {
  if (!appData?.social?.configured) setMessage(isEnglish() ? 'Cloud service is not configured for this build.' : '当前安装包尚未配置云端服务。', true, '#socialMessage');
  else if ($('#socialAuthPanel')) $('#socialAuthPanel').hidden = false;
});
$('#sendEmailCode')?.addEventListener('click', async () => {
  try { await window.breaklock.requestEmailCode($('#socialEmail')?.value); setMessage(isEnglish() ? 'Code sent.' : '验证码已发送。', false, '#socialMessage'); }
  catch (error) { setMessage(error.message, true, '#socialMessage'); }
});
$('#verifyEmailCode')?.addEventListener('click', async () => {
  try { socialState = await window.breaklock.verifyEmailCode($('#socialEmail')?.value, $('#socialOtp')?.value); await loadSocialState(); }
  catch (error) { setMessage(error.message, true, '#socialMessage'); }
});
$('#githubLogin')?.addEventListener('click', async () => {
  try { await window.breaklock.startGithubLogin(); setMessage(isEnglish() ? 'Finish sign-in in your browser.' : '请在浏览器完成登录。', false, '#socialMessage'); }
  catch (error) { setMessage(error.message, true, '#socialMessage'); }
});
$('#createSquad')?.addEventListener('click', async () => {
  try { socialState = await window.breaklock.createSquad($('#squadName')?.value); renderSquad(); }
  catch (error) { setMessage(error.message, true, '#socialMessage'); }
});
$('#joinSquad')?.addEventListener('click', async () => {
  try { socialState = await window.breaklock.joinSquad($('#squadInviteCode')?.value); renderSquad(); }
  catch (error) { setMessage(error.message, true, '#socialMessage'); }
});
$('#signOutSocial')?.addEventListener('click', async () => { await window.breaklock.signOutSocial(); socialState = { configured: true, authenticated: false }; renderSquad(); });
$('#exportShareCard')?.addEventListener('click', async () => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1200; canvas.height = 630;
    const context = canvas.getContext('2d');
    context.fillStyle = '#08090b'; context.fillRect(0, 0, 1200, 630);
    context.fillStyle = '#e5484d'; context.fillRect(0, 0, 16, 630);
    context.fillStyle = '#f3f5f7'; context.font = '700 44px Segoe UI'; context.fillText('DOMODORO', 72, 90);
    context.fillStyle = '#98a1ad'; context.font = '24px Segoe UI'; context.fillText(isEnglish() ? 'WEEKLY RECOVERY REPORT' : '本周专注与恢复报告', 72, 132);
    context.fillStyle = '#d4a64e'; context.font = '700 150px Bahnschrift'; context.fillText(String(appData?.analytics?.weeklyScore || 0), 72, 350);
    context.fillStyle = '#98a1ad'; context.font = '28px Segoe UI'; context.fillText('/ 500 BALANCE SCORE', 78, 395);
    context.fillStyle = '#4fbf9f'; context.font = '700 30px Segoe UI'; context.fillText(`${appData?.analytics?.restCompliance || 0}% ${isEnglish() ? 'BREAK COMPLIANCE' : '休息完成率'}`, 72, 480);
    context.fillStyle = '#2b3037'; context.fillRect(72, 535, 1040, 2);
    context.fillStyle = '#98a1ad'; context.font = '22px Segoe UI'; context.fillText(isEnglish() ? 'Focus hard. Recover on time.' : '认真专注，准时恢复。', 72, 580);
    const result = await window.breaklock.saveShareCard(canvas.toDataURL('image/png'));
    setMessage(result.ok ? (isEnglish() ? 'Weekly card saved.' : '本周分享卡已保存。') : '', false, '#socialMessage');
  } catch (error) { setMessage(error.message, true, '#socialMessage'); }
});
$('#onboardingPersona')?.addEventListener('change', (event) => {
  const row = $('#adultConfirmRow');
  if (row) row.hidden = event.target.value !== 'adult';
});
$('#completeOnboarding')?.addEventListener('click', async () => {
  const personaMode = $('#onboardingPersona')?.value || 'safe';
  if (personaMode === 'adult' && !$('#adultConfirm')?.checked) {
    setText('#onboardingMessage', '启用成人视觉包前需要确认已满 18 岁。');
    return;
  }
  appData = await window.breaklock.saveSettings({
    overlay: { intensity: $('#onboardingIntensity')?.value || 'normal' },
    persona: { personaMode },
    analytics: { dailyFocusGoalMinutes: Number($('#onboardingGoal')?.value || 160) },
    app: { onboardingComplete: true }
  });
  $('#onboardingDialog')?.close?.();
  hydrateSettings();
  renderPersona(appData.state);
});

for (const languageSelect of $all('#quickLanguage, select[name="language"]')) {
  languageSelect.addEventListener('change', async (event) => {
    appData = await window.breaklock.saveSettings({ app: { language: event.target.value } });
    for (const select of $all('#quickLanguage, select[name="language"]')) select.value = event.target.value;
    applyInterfaceCopy();
    renderPresetCards();
    renderPacks();
    renderState(appData.state);
    renderToday();
    renderAnalytics();
    renderSquad();
  });
}

$all('[data-persona-image]').forEach((image) => image.addEventListener('error', () => {
  image.hidden = true;
  const fallback = image.parentElement?.querySelector?.('[data-persona-fallback]');
  if (fallback) fallback.hidden = false;
}));

window.breaklock.onState((state) => {
  const previousPhase = latestState?.phase;
  renderState(state);
  if (previousPhase && previousPhase !== state.phase) refresh();
});
window.breaklock.onSocialChanged?.(() => loadSocialState());
window.breaklock.onNavigate?.((route) => setRoute(route));

refresh().catch((error) => setMessage(error.message, true));
