let appData;
let latestState;
let selectedPresetId = 'medium';
let lastRewardScore = null;

const personaAssetBase = '../assets/personas/';

function $(selector) {
  return document.querySelector(selector);
}

function setText(selector, value) {
  const node = $(selector);
  if (node) node.textContent = value;
}

function copy() {
  return appData?.copy || {};
}

function rendererCopy() {
  return copy().renderer || {};
}

function personaLines() {
  return appData?.personaLines || copy().personaLines || {};
}

function setLabelPrefix(selector, text) {
  const label = $(selector);
  if (!label) return;
  const node = [...(label.childNodes || [])].find((child) => child.nodeType === 3);
  if (node) {
    node.nodeValue = text;
  } else {
    label.prepend(document.createTextNode(text));
  }
}

function setSelectOption(name, value, text) {
  const option = document.querySelector(`select[name="${name}"] option[value="${value}"]`);
  if (option) option.textContent = text;
}

function personaName(persona) {
  return copy().personaNames?.[persona?.id] || persona?.name || '纪律调教官';
}

function numberValue(input, fallback) {
  return Number(input?.value || fallback);
}

function minutesSeconds(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function applyLanguage() {
  const ui = rendererCopy();
  if (document.documentElement) document.documentElement.lang = appData?.language || appData?.settings?.app?.language || 'zh-CN';
  document.title = copy().appTitle || 'Domodoro';
  $('.training-chamber')?.setAttribute?.('aria-label', ui.chamberLabel || '调教官训练舱');

  setText('#lockAuthorityLabel', ui.lockAuthority || 'LOCK AUTHORITY');
  setText('#statusSubline', ui.statusStandby || '训练舱待命');
  setText('#presetShortName', ui.shortPreset || '短训');
  setText('#presetMediumName', ui.mediumPreset || '标准');
  setText('#presetLongName', ui.longPreset || '深度');
  setText('#startFocus', ui.start || '接受训练');
  setText('#snoozeFocus', ui.snooze || '延长 5 分钟');
  setText('#continueAfterBreak', personaLines().decision?.continue || '继续下一轮');
  setText('#finishDay', personaLines().decision?.finish || '今天饶过你');
  setText('#extendBreak', personaLines().decision?.extend || '再恢复 5 分钟');
  setText('#todayDisciplineLabel', ui.todayDiscipline || '今日纪律');
  setText('#scoreLabel', ui.scoreLabel || '纪律积分');
  setText('#personaArchiveLabel', ui.personaArchive || '角色档案');
  setText('#focusSessionsLabel', ui.focusSessions || '完成训练');
  setText('#breaksCompletedLabel', ui.breaksCompleted || '合格休息');
  setText('#pausesUsedLabel', ui.pausesUsed || '额外宽限');
  setText('#bypassesLabel', ui.bypasses || '失控记录');
  setText('#armoryTitle', ui.armoryTitle || '装备室 / 高级调校');
  setText('#armorySubtitle', ui.armorySubtitle || '套餐、遮罩、约束');
  setText('#trainingPresetsTitle', ui.trainingPresets || '训练套餐');
  setText('#manualTimerTitle', ui.manualTimer || '手动计时');
  setText('#overlayEngineTitle', ui.overlayEngine || '遮罩引擎');
  setText('#customVideoLabel', ui.customVideo || '启用自定义视频遮罩');
  setText('#soundEnabledLabel', ui.soundEnabled || '启用音效');
  setText('#personaRulesTitle', ui.personaAndRules || '角色与约束');
  setText('#startupLabel', ui.startup || '开机自启动');
  setText('#saveSettings', ui.save || '保存调校');
  setText('.quick-language span', 'Language');

  setLabelPrefix('#presetShortMinutesLabel', ui.shortMinutes || '短训分钟');
  setLabelPrefix('#presetMediumMinutesLabel', ui.mediumMinutes || '标准分钟');
  setLabelPrefix('#presetLongMinutesLabel', ui.longMinutes || '深度分钟');
  setLabelPrefix('#focusMinutesLabel', ui.focusMinutes || '专注分钟');
  setLabelPrefix('#shortBreakMinutesLabel', ui.shortBreakMinutes || '短休分钟');
  setLabelPrefix('#longBreakMinutesLabel', ui.longBreakMinutes || '长休分钟');
  setLabelPrefix('#longBreakEveryLabel', ui.longBreakEvery || '长休间隔');
  setLabelPrefix('#videoUrlLabel', ui.videoUrl || '视频直链');
  setLabelPrefix('#accentColorLabel', ui.accentColor || '主色');
  setLabelPrefix('#intensityLabel', ui.intensity || '遮罩强度');
  setLabelPrefix('#customWarningsLabel', ui.customWarnings || '自定义警告语');
  setLabelPrefix('#languageLabel', ui.language || '界面语言');
  setLabelPrefix('#visualModeLabel', ui.visualMode || '视觉模式');
  setLabelPrefix('#pauseLimitLabel', ui.pauseLimit || '每日暂停/延长上限');
  setLabelPrefix('#bypassPasswordLabel', ui.bypassPassword || '设置/更新绕过密码');

  setSelectOption('intensity', 'hard', ui.intensityHard || '狠');
  setSelectOption('intensity', 'normal', ui.intensityNormal || '标准');
  setSelectOption('intensity', 'light', ui.intensityLight || '轻');
  setSelectOption('visualMode', 'dark-training-chamber', ui.darkTrainingChamber || '暗黑训练舱');
  setSelectOption('visualMode', 'red-alert-hud', ui.redAlertHud || '红色警戒 HUD');

  const warnings = document.querySelector('textarea[name="customWarningLines"]');
  if (warnings) warnings.placeholder = ui.customWarningsPlaceholder || '每行一句';
  const bypass = document.querySelector('input[name="bypassPasswordPlain"]');
  if (bypass) bypass.placeholder = ui.bypassPasswordPlaceholder || '留空则不修改';
}

function setMessage(text, isError = false) {
  const node = $('#actionMessage');
  node.textContent = text || '';
  node.classList.toggle('error', isError);
}

function setPersonaMode(stage) {
  const chamber = $('.training-chamber');
  if (chamber) chamber.dataset.personaMode = stage?.mode || 'standby';
  setText('#personaStageLabel', stage?.label || copy().stageLabels?.idle || '待命凝视');
  const image = $('#officerImage');
  if (image) {
    const mode = stage?.mode || 'standby';
    const assets = latestState?.persona?.assets || {};
    const fileName = mode === 'standby'
      ? assets.standby || 'discipline-officer.png'
      : assets.training || 'discipline-officer-training.png';
    const nextSrc = `${personaAssetBase}${fileName}`;
    if (!image.src.endsWith(fileName)) image.src = nextSrc;
  }
  setText('#personaName', personaName(latestState?.persona));
}

function triggerTrainingBurst() {
  const chamber = $('.training-chamber');
  if (!chamber) return;
  chamber.classList.remove('training-burst');
  void chamber.offsetWidth;
  chamber.classList.add('training-burst');
  setTimeout(() => chamber.classList.remove('training-burst'), 1800);
}

function renderState(state) {
  const previousPhase = latestState?.phase;
  latestState = state;
  setPersonaMode(state.personaStage);
  if (previousPhase && previousPhase !== 'focus' && state.phase === 'focus') triggerTrainingBurst();
  $('#phaseLabel').textContent = copy().phaseNames?.[state.phase] || state.phase;
  $('#timeLeft').textContent = state.phase === 'idle' ? '--:--' : minutesSeconds(state.remainingMs);
  $('#startFocus').disabled = state.isBreakActive || state.isDecisionActive;
  $('#snoozeFocus').disabled = state.phase !== 'focus';
  setText('#currentCommand', state.commandLine || personaLines().states?.idle || '');
  setText('#hudCommand', state.commandLine || personaLines().states?.idle || '');
  const decisionPanel = $('#decisionPanel');
  if (decisionPanel) decisionPanel.hidden = !state.isDecisionActive;
}

function renderStats(today, discipline = appData?.discipline, unlockPreview = appData?.unlockPreview) {
  const score = discipline?.score || 0;
  setText('#focusSessions', today.focusSessions || 0);
  setText('#breaksCompleted', today.breaksCompleted || 0);
  setText('#pausesUsed', today.pausesUsed || 0);
  setText('#bypasses', today.bypasses?.length || 0);
  setText('#disciplineScore', score);
  setText('#disciplineRank', copy().ranks?.[discipline?.rankKey] || discipline?.rank || copy().ranks?.coldStart || '冷启动');
  setText('#rewardProgressLabel', `${discipline?.rewardProgress || 0}%`);
  setText('#unlockPersonaName', personaName(unlockPreview));
  setText('#unlockPersonaScore', `${score}/${unlockPreview?.requiredScore || 160}`);
  setText('#unlockPersonaState', unlockPreview?.unlocked
    ? rendererCopy().unlockAvailable || '可解锁'
    : rendererCopy().unlockLocked || '未解锁');
  const rewardProgress = $('#rewardProgress');
  if (rewardProgress) rewardProgress.style.width = `${discipline?.rewardProgress || 0}%`;
  const unlockProgress = $('#unlockProgress');
  if (unlockProgress) unlockProgress.style.width = `${unlockPreview?.progress || 0}%`;
  const scoreBlock = $('.score-block');
  if (scoreBlock && lastRewardScore !== null && score > lastRewardScore) {
    scoreBlock.classList.remove('reward-burst');
    void scoreBlock.offsetWidth;
    scoreBlock.classList.add('reward-burst');
  }
  lastRewardScore = score;
}

function renderPacks(packs, settings) {
  const enabled = new Set(settings.overlay.enabledPackIds || []);
  const packList = $('#packList');
  packList.replaceChildren();
  for (const pack of packs.filter((item) => item.id !== 'custom-video')) {
    const label = document.createElement('label');
    label.className = 'pack';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = 'pack';
    input.value = pack.id;
    input.checked = enabled.has(pack.id);

    const name = document.createElement('span');
    name.textContent = copy().packNames?.[pack.name] || pack.name;

    const type = document.createElement('small');
    type.textContent = pack.type;

    label.append(input, name, type);
    packList.append(label);
  }
  $('#enableCustomVideo').checked = enabled.has('custom-video');
}

function fillForm(settings) {
  const form = $('#settingsForm');
  selectedPresetId = settings.timer.selectedPresetId || 'medium';
  const advancedSettings = $('#advancedSettings');
  if (advancedSettings) advancedSettings.open = Boolean(settings.timer.advancedModeEnabled);
  form.focusMinutes.value = settings.timer.focusMinutes;
  form.shortBreakMinutes.value = settings.timer.shortBreakMinutes;
  form.longBreakMinutes.value = settings.timer.longBreakMinutes;
  form.longBreakEvery.value = settings.timer.longBreakEvery;
  if (form.presetShortMinutes) form.presetShortMinutes.value = settings.timer.presets?.short?.focusMinutes || 20;
  if (form.presetMediumMinutes) form.presetMediumMinutes.value = settings.timer.presets?.medium?.focusMinutes || 40;
  if (form.presetLongMinutes) form.presetLongMinutes.value = settings.timer.presets?.long?.focusMinutes || 60;
  form.videoUrl.value = settings.overlay.videoUrl || '';
  form.accentColor.value = settings.overlay.accentColor || '#ff3b30';
  form.intensity.value = settings.overlay.intensity || 'hard';
  form.customWarningLines.value = (settings.overlay.customWarningLines || []).join('\n');
  form.soundEnabled.checked = Boolean(settings.overlay.soundEnabled);
  if (form.visualMode) form.visualMode.value = settings.persona?.visualMode || 'dark-training-chamber';
  form.pauseLimitPerDay.value = settings.controls.pauseLimitPerDay;
  if (form.language) form.language.value = settings.app.language || 'zh-CN';
  const quickLanguage = $('#quickLanguage');
  if (quickLanguage) quickLanguage.value = settings.app.language || 'zh-CN';
  form.startupEnabled.checked = Boolean(settings.app.startupEnabled);
}

function renderPresetCards(settings, lines) {
  const presets = settings.timer.presets || {};
  const presetLines = lines?.presets || {};
  const shortMinutes = presets.short?.focusMinutes || 20;
  const mediumMinutes = presets.medium?.focusMinutes || 40;
  const longMinutes = presets.long?.focusMinutes || 60;

  setText('#presetShortTitle', `${shortMinutes}m`);
  setText('#presetMediumTitle', `${mediumMinutes}m`);
  setText('#presetLongTitle', `${longMinutes}m`);
  setText('#presetShortLine', presetLines.short?.subtitle || '');
  setText('#presetMediumLine', presetLines.medium?.subtitle || '');
  setText('#presetLongLine', presetLines.long?.subtitle || '');

  for (const button of document.querySelectorAll('[data-preset-id]')) {
    button.classList?.toggle('selected', button.dataset.presetId === selectedPresetId);
  }
}

function collectSettings() {
  const form = $('#settingsForm');
  const enabledPackIds = [...document.querySelectorAll('input[name="pack"]:checked')].map((input) => input.value);
  if ($('#enableCustomVideo').checked) enabledPackIds.push('custom-video');

  const controls = {
    pauseLimitPerDay: Number(form.pauseLimitPerDay.value)
  };
  if (form.bypassPasswordPlain.value) {
    controls.bypassPasswordPlain = form.bypassPasswordPlain.value;
  }

  const payload = {
    timer: {
      focusMinutes: Number(form.focusMinutes.value),
      shortBreakMinutes: Number(form.shortBreakMinutes.value),
      longBreakMinutes: Number(form.longBreakMinutes.value),
      longBreakEvery: Number(form.longBreakEvery.value),
      selectedPresetId,
      advancedModeEnabled: Boolean($('#advancedSettings')?.open),
      presets: {
        short: { focusMinutes: numberValue(form.presetShortMinutes, 20) },
        medium: { focusMinutes: numberValue(form.presetMediumMinutes, 40) },
        long: { focusMinutes: numberValue(form.presetLongMinutes, 60) }
      }
    },
    overlay: {
      enabledPackIds,
      accentColor: form.accentColor.value,
      intensity: form.intensity.value,
      videoUrl: form.videoUrl.value.trim(),
      soundEnabled: form.soundEnabled.checked,
      customWarningLines: form.customWarningLines.value
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
    },
    controls,
    app: {
      language: form.language?.value || 'zh-CN',
      startupEnabled: form.startupEnabled.checked
    }
  };

  if (form.visualMode) {
    payload.persona = {
      selectedPersonaId: 'discipline-officer',
      visualMode: form.visualMode.value
    };
  }

  return payload;
}

async function refresh() {
  appData = await window.breaklock.getInit();
  applyLanguage();
  renderState(appData.state);
  renderStats(appData.today, appData.discipline, appData.unlockPreview);
  renderPacks(appData.packs, appData.settings);
  fillForm(appData.settings);
  renderPresetCards(appData.settings, appData.personaLines);
}

async function startSelectedPreset(presetId = selectedPresetId) {
  selectedPresetId = presetId;
  appData = await window.breaklock.saveSettings(collectSettings());
  applyLanguage();
  $('#settingsForm').bypassPasswordPlain.value = '';
  renderStats(appData.today, appData.discipline, appData.unlockPreview);
  renderPacks(appData.packs, appData.settings);
  renderPresetCards(appData.settings, appData.personaLines);
  const result = await window.breaklock.startPreset(presetId);
  if (result.ok) triggerTrainingBurst();
  setMessage(result.ok ? personaLines().feedback?.started || '训练开始。' : result.error, !result.ok);
}

$('#startFocus').addEventListener('click', async () => {
  await startSelectedPreset();
});

$('#snoozeFocus').addEventListener('click', async () => {
  const result = await window.breaklock.snoozeFocus();
  setMessage(result.ok ? rendererCopy().snoozed || '已延长 5 分钟。' : result.error, !result.ok);
  await refresh();
});

$('#settingsForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  appData = await window.breaklock.saveSettings(collectSettings());
  applyLanguage();
  $('#settingsForm').bypassPasswordPlain.value = '';
  renderStats(appData.today, appData.discipline, appData.unlockPreview);
  renderPacks(appData.packs, appData.settings);
  fillForm(appData.settings);
  renderPresetCards(appData.settings, appData.personaLines);
  setMessage(personaLines().feedback?.saved || '设置已保存。');
});

async function changeLanguage(language) {
  appData = await window.breaklock.saveSettings({ app: { language } });
  applyLanguage();
  renderState(appData.state);
  renderStats(appData.today, appData.discipline, appData.unlockPreview);
  renderPacks(appData.packs, appData.settings);
  fillForm(appData.settings);
  renderPresetCards(appData.settings, appData.personaLines);
  setMessage(personaLines().feedback?.saved || '设置已保存。');
}

for (const languageSelect of document.querySelectorAll('select[name="language"], #quickLanguage')) {
  languageSelect.addEventListener('change', async (event) => {
    const nextLanguage = event.currentTarget.value;
    for (const select of document.querySelectorAll('select[name="language"], #quickLanguage')) {
      select.value = nextLanguage;
    }
    await changeLanguage(nextLanguage);
  });
}

for (const button of document.querySelectorAll('[data-preset-id]')) {
  button.addEventListener('click', async (event) => {
    await startSelectedPreset(event.currentTarget.dataset.presetId);
  });
}

const continueButton = $('#continueAfterBreak');
if (continueButton) {
  continueButton.addEventListener('click', async () => {
    const result = await window.breaklock.continueAfterBreak();
    setMessage(result.ok ? personaLines().feedback?.started || '训练开始。' : result.error, !result.ok);
    await refresh();
  });
}

const finishButton = $('#finishDay');
if (finishButton) {
  finishButton.addEventListener('click', async () => {
    const result = await window.breaklock.finishDay();
    setMessage(result.ok ? personaLines().feedback?.finished || '今天到此为止。' : result.error, !result.ok);
    await refresh();
  });
}

const extendButton = $('#extendBreak');
if (extendButton) {
  extendButton.addEventListener('click', async () => {
    const result = await window.breaklock.extendBreak();
    setMessage(result.ok ? personaLines().feedback?.extended || '再恢复 5 分钟。' : result.error, !result.ok);
    await refresh();
  });
}

window.breaklock.onState((state) => {
  const previousPhase = latestState?.phase;
  renderState(state);
  if (previousPhase !== state.phase) refresh();
});

function bindPersonaFallback() {
  for (const image of document.querySelectorAll('[data-persona-image]')) {
    image.addEventListener('error', () => {
      image.hidden = true;
      const fallback = image.parentElement?.querySelector?.('[data-persona-fallback]');
      if (fallback) fallback.hidden = false;
    });
  }
}

bindPersonaFallback();
refresh();
