const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage, safeStorage, shell, dialog } = require('electron');

const { createSettingsStore } = require('../core/settingsStore');
const { createHistoryStore } = require('../core/historyStore');
const { createSessionStateStore } = require('../core/sessionStateStore');
const { trayActionIdsForPhase } = require('../core/trayRules');
const { buildAnalytics } = require('../core/analyticsRules');
const { selectOverlayPack, resolveOverlayPack } = require('../core/overlayEngine');
const { loadOverlayPacks } = require('../core/overlayPacks');
const { hashPassword, verifyPassword } = require('../core/password');
const { nextBreakKind, canUsePause, getPreset, breakCompletionPhase } = require('../core/timerRules');
const { BREAK_REWARD_POINTS, buildDisciplineProfile } = require('../core/rewardRules');
const { personaForSession, personaStageForPhase, personaUnlockPreview } = require('../core/personaStage');
const { overlayRitualForPhase } = require('../core/overlayRitual');
const { PRE_BREAK_WARNING_MS, shouldOpenPreBreakWarning, shouldResetPreBreakWarning } = require('../core/preBreakWarning');
const { copyForLanguage, normalizeLanguage } = require('../core/i18n');
const { createSocialService } = require('./socialService');

const FIVE_MINUTES_MS = 5 * 60 * 1000;

let settingsStore;
let historyStore;
let sessionStateStore;
let socialService;
let tray;
let trayMenu;
let settingsWindow;
let ticker;
let isQuitting = false;
let overlayWindows = [];
let currentOverlayPayload = null;
let allowOverlayClose = false;
let warningWindow;
let warningShownForFocus = false;
let pendingAuthCallback = null;

const timerState = {
  phase: 'idle',
  startedAt: null,
  endsAt: null,
  focusSessionsCompleted: 0,
  focusMinutes: 0,
  breakMinutes: 0,
  currentPackId: null,
  breakKind: null,
  selectedPresetId: 'medium',
  activePersonaIndex: 0,
  sessionId: null,
  taskLabel: '',
  taskCategory: 'other'
};

function persistTimerState() {
  if (!sessionStateStore) return;
  if (timerState.phase === 'idle') {
    sessionStateStore.clear();
    return;
  }
  sessionStateStore.save(timerState);
}

function currentLanguage() {
  return normalizeLanguage(settingsStore?.load?.().app?.language);
}

function currentCopy() {
  return copyForLanguage(currentLanguage());
}

function currentPersona() {
  const persona = personaForSession(timerState.activePersonaIndex);
  const names = currentCopy().personaNames || {};
  return {
    ...persona,
    name: names[persona.id] || persona.name
  };
}

function trayIcon() {
  return nativeImage.createFromPath(appPaths().trayIconPng).resize({ width: 16, height: 16 });
}

function windowIcon() {
  return nativeImage.createFromPath(appPaths().iconPng);
}

function isBreakPhase() {
  return timerState.phase === 'shortBreak' || timerState.phase === 'longBreak';
}

function isDecisionPhase() {
  return timerState.phase === 'awaitingDecision';
}

function isOverlayBlockingPhase() {
  return isBreakPhase() || isDecisionPhase();
}

function remainingMs() {
  if (!timerState.endsAt) return 0;
  return Math.max(0, timerState.endsAt - Date.now());
}

function publicState() {
  const copy = currentCopy();
  const personaLines = copy.personaLines;
  const rawStage = personaStageForPhase(timerState.phase);
  const stageLabel = timerState.phase === 'longBreak'
    ? copy.stageLabels.longBreak
    : copy.stageLabels[rawStage.lineKey] || rawStage.label;
  return {
    ...timerState,
    remainingMs: remainingMs(),
    isBreakActive: isBreakPhase(),
    isDecisionActive: isDecisionPhase(),
    commandLine: personaLines.states[rawStage.lineKey] || personaLines.states[timerState.phase] || personaLines.states.idle,
    personaStage: {
      ...rawStage,
      label: stageLabel
    },
    persona: currentPersona()
  };
}

function appPaths() {
  return {
    preload: path.join(__dirname, 'preload.js'),
    settingsHtml: path.join(__dirname, '../renderer/index.html'),
    overlayHtml: path.join(__dirname, '../overlay/overlay.html'),
    warningHtml: path.join(__dirname, '../warning/warning.html'),
    overlaysDir: path.join(__dirname, '../overlays'),
    iconPng: path.join(__dirname, '../assets/breaklock-icon.png'),
    trayIconPng: path.join(__dirname, '../assets/breaklock-tray.png')
  };
}

function broadcastState() {
  const state = publicState();
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.webContents.send('timer:state', state);
  }
  for (const win of overlayWindows) {
    if (!win.isDestroyed()) win.webContents.send('timer:state', state);
  }
  if (warningWindow && !warningWindow.isDestroyed()) {
    warningWindow.webContents.send('timer:state', state);
  }
  buildTrayMenu();
}

function closeWarningWindow() {
  if (warningWindow && !warningWindow.isDestroyed()) warningWindow.close();
  warningWindow = null;
}

function createWarningWindow() {
  if (warningWindow && !warningWindow.isDestroyed()) return;
  const display = screen.getPrimaryDisplay();
  const width = Math.min(760, Math.max(560, Math.floor(display.workAreaSize.width * 0.38)));
  const height = 360;
  const x = display.workArea.x + Math.floor((display.workArea.width - width) / 2);
  const y = display.workArea.y + Math.max(24, Math.floor(display.workArea.height * 0.1));

  warningWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    frame: false,
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    icon: windowIcon(),
    backgroundColor: '#050507',
    webPreferences: {
      preload: appPaths().preload,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  warningWindow.loadFile(appPaths().warningHtml);
  warningWindow.once('ready-to-show', () => warningWindow?.show());
  warningWindow.on('closed', () => {
    warningWindow = null;
  });
}

function managePreBreakWarning() {
  const state = publicState();
  if (shouldResetPreBreakWarning({ phase: state.phase, remainingMs: state.remainingMs })) {
    warningShownForFocus = false;
    closeWarningWindow();
  }

  if (shouldOpenPreBreakWarning({
    phase: state.phase,
    remainingMs: state.remainingMs,
    alreadyShown: warningShownForFocus
  })) {
    warningShownForFocus = true;
    createWarningWindow();
  }
}

function startTicker() {
  clearInterval(ticker);
  ticker = setInterval(tick, 500);
  broadcastState();
}

function stopTickerIfIdle() {
  if (timerState.phase === 'idle') {
    clearInterval(ticker);
    ticker = null;
  }
}

function loadPacks(settings) {
  return loadOverlayPacks(appPaths().overlaysDir, settings);
}

function setStartup(openAtLogin) {
  try {
    app.setLoginItemSettings({
      openAtLogin: Boolean(openAtLogin),
      path: process.execPath,
      args: app.isPackaged ? [] : [app.getAppPath()]
    });
  } catch {
    // Some portable/dev contexts do not expose login-item settings.
  }
}

function getInitPayload() {
  const settings = settingsStore.load();
  const language = normalizeLanguage(settings.app.language);
  const copy = copyForLanguage(language);
  const today = historyStore.getToday();
  const discipline = buildDisciplineProfile(settings, today);
  const analytics = buildAnalytics(historyStore.load(), historyStore.getRange(30));
  return {
    appVersion: app.getVersion(),
    settings,
    language,
    copy,
    packs: loadPacks(settings).map(({ packDir, ...pack }) => pack),
    personaLines: copy.personaLines,
    today,
    discipline,
    analytics,
    social: socialService?.getCachedState?.() || { configured: false, authenticated: false },
    unlockPreview: personaUnlockPreview(discipline.score),
    state: publicState()
  };
}

function createSettingsWindow(route = 'focus') {
  const targetRoute = ['focus', 'insights', 'squad', 'armory'].includes(route) ? route : 'focus';
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
    if (settingsWindow.webContents.isLoading()) {
      settingsWindow.webContents.once('did-finish-load', () => settingsWindow?.webContents.send('app:navigate', targetRoute));
    } else {
      settingsWindow.webContents.send('app:navigate', targetRoute);
    }
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'Domodoro',
    icon: windowIcon(),
    backgroundColor: '#08090b',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#08090b',
      symbolColor: '#f3f5f7',
      height: 38
    },
    webPreferences: {
      preload: appPaths().preload,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  settingsWindow.setMenuBarVisibility(false);
  settingsWindow.loadFile(appPaths().settingsHtml);
  settingsWindow.webContents.once('did-finish-load', () => settingsWindow?.webContents.send('app:navigate', targetRoute));
  settingsWindow.on('closed', () => { settingsWindow = null; });
}

function closeOverlayWindows() {
  allowOverlayClose = true;
  for (const win of overlayWindows) {
    if (!win.isDestroyed()) win.close();
  }
  overlayWindows = [];
  currentOverlayPayload = null;
  allowOverlayClose = false;
}

function createOverlayWindows(payload) {
  closeOverlayWindows();
  currentOverlayPayload = payload;
  allowOverlayClose = false;

  for (const display of screen.getAllDisplays()) {
    const win = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
      frame: false,
      icon: windowIcon(),
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      fullscreen: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      backgroundColor: '#09090b',
      webPreferences: {
        preload: appPaths().preload,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true
      }
    });

    win.on('close', (event) => {
      if (!allowOverlayClose && isOverlayBlockingPhase()) event.preventDefault();
    });
    win.setAlwaysOnTop(true, 'screen-saver');
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.loadFile(appPaths().overlayHtml);
    win.once('ready-to-show', () => {
      win.show();
      win.focus();
    });
    overlayWindows.push(win);
  }
}

function resetToIdle() {
  closeWarningWindow();
  warningShownForFocus = false;
  timerState.phase = 'idle';
  timerState.startedAt = null;
  timerState.endsAt = null;
  timerState.focusMinutes = 0;
  timerState.breakMinutes = 0;
  timerState.currentPackId = null;
  timerState.breakKind = null;
  timerState.sessionId = null;
  timerState.taskLabel = '';
  timerState.taskCategory = 'other';
  persistTimerState();
  stopTickerIfIdle();
  broadcastState();
}

function beginFocus({ focusMinutes, selectedPresetId = timerState.selectedPresetId, context = {} }) {
  if (isOverlayBlockingPhase()) return { ok: false, error: currentCopy().errors.finishCurrentBreak };

  timerState.phase = 'focus';
  timerState.startedAt = Date.now();
  timerState.focusMinutes = Number(focusMinutes);
  timerState.endsAt = Date.now() + Number(focusMinutes) * 60 * 1000;
  timerState.breakMinutes = 0;
  timerState.currentPackId = null;
  timerState.breakKind = null;
  timerState.selectedPresetId = selectedPresetId;
  timerState.activePersonaIndex = timerState.focusSessionsCompleted;
  timerState.sessionId = randomUUID();
  timerState.taskLabel = String(context.taskLabel || '').trim().slice(0, 120);
  timerState.taskCategory = String(context.taskCategory || 'other').trim().slice(0, 32) || 'other';
  historyStore.recordSessionStart({
    sessionId: timerState.sessionId,
    startedAt: new Date(timerState.startedAt).toISOString(),
    presetId: selectedPresetId,
    taskLabel: timerState.taskLabel,
    taskCategory: timerState.taskCategory,
    plannedFocusMinutes: timerState.focusMinutes
  });
  warningShownForFocus = false;
  closeWarningWindow();
  persistTimerState();
  startTicker();
  return { ok: true, state: publicState() };
}

function startFocus() {
  const settings = settingsStore.load();
  return beginFocus({
    focusMinutes: settings.timer.focusMinutes,
    selectedPresetId: settings.timer.selectedPresetId
  });
}

function startPreset(presetId, context = {}) {
  const settings = settingsStore.save({ timer: { selectedPresetId: presetId } });
  const preset = getPreset(settings, presetId);
  return beginFocus({
    focusMinutes: preset.focusMinutes,
    selectedPresetId: presetId,
    context
  });
}

function createOverlayPayload(kind, settings, selectedPack, fallbackPack) {
  const copy = copyForLanguage(settings.app.language);
  return {
    settings: settings.overlay,
    pack: selectedPack,
    fallbackPack,
    language: copy.language,
    copy,
    personaLines: copy.personaLines,
    persona: settings.persona,
    ritual: overlayRitualForPhase(kind),
    state: publicState()
  };
}

function startBreak(kind) {
  closeWarningWindow();
  warningShownForFocus = false;
  const settings = settingsStore.load();
  const packs = loadPacks(settings);
  const selectedPack = resolveOverlayPack(selectOverlayPack(packs, settings), packs, settings);
  const fallbackPack = resolveOverlayPack(packs.find((pack) => pack.id === settings.overlay.fallbackPackId), packs, settings);
  const minutes = kind === 'longBreak'
    ? Number(settings.timer.longBreakMinutes)
    : Number(settings.timer.shortBreakMinutes);

  timerState.phase = kind;
  timerState.startedAt = Date.now();
  timerState.endsAt = Date.now() + minutes * 60 * 1000;
  timerState.breakMinutes = minutes;
  timerState.currentPackId = selectedPack.id;
  timerState.breakKind = kind;
  persistTimerState();
  currentOverlayPayload = createOverlayPayload(kind, settings, selectedPack, fallbackPack);
  createOverlayWindows(currentOverlayPayload);
  startTicker();
}

function finishBreak({ bypassed = false, reason = '' } = {}) {
  const packId = timerState.currentPackId;
  const minutes = timerState.breakMinutes;

  if (bypassed) {
    historyStore.recordBypass({ reason, packId, sessionId: timerState.sessionId });
    closeOverlayWindows();
    resetToIdle();
  } else {
    historyStore.recordBreakComplete({ minutes, packId, sessionId: timerState.sessionId });
    const settings = settingsStore.load();
    settingsStore.save({
      persona: {
        rewardScore: Number(settings.persona?.rewardScore || 0) + BREAK_REWARD_POINTS
      }
    });
    timerState.phase = breakCompletionPhase({ bypassed });
    timerState.startedAt = null;
    timerState.endsAt = null;
    persistTimerState();
    if (currentOverlayPayload) currentOverlayPayload.state = publicState();
    clearInterval(ticker);
    ticker = null;
    broadcastState();
  }
}

function tick() {
  if (timerState.phase === 'idle') {
    stopTickerIfIdle();
    return;
  }

  if (remainingMs() > 0) {
    managePreBreakWarning();
    broadcastState();
    return;
  }

  if (timerState.phase === 'focus') {
    const settings = settingsStore.load();
    historyStore.recordFocusComplete({
      minutes: timerState.focusMinutes || settings.timer.focusMinutes,
      sessionId: timerState.sessionId,
      presetId: timerState.selectedPresetId,
      taskLabel: timerState.taskLabel,
      taskCategory: timerState.taskCategory,
      startedAt: timerState.startedAt ? new Date(timerState.startedAt).toISOString() : undefined,
      endedAt: new Date().toISOString()
    });
    timerState.focusSessionsCompleted += 1;
    startBreak(nextBreakKind(timerState.focusSessionsCompleted, settings.timer.longBreakEvery));
    return;
  }

  if (isBreakPhase()) {
    finishBreak();
  }
}

function continueAfterBreak() {
  if (!isDecisionPhase()) return { ok: false, error: currentCopy().errors.noContinue };
  const presetId = timerState.selectedPresetId || settingsStore.load().timer.selectedPresetId;
  closeOverlayWindows();
  resetToIdle();
  return startPreset(presetId);
}

function finishDay() {
  if (!isDecisionPhase()) return { ok: false, error: currentCopy().errors.cannotFinish };
  closeOverlayWindows();
  resetToIdle();
  return { ok: true, state: publicState() };
}

function extendBreak() {
  if (!isDecisionPhase()) return { ok: false, error: currentCopy().errors.cannotExtend };
  const settings = settingsStore.load();
  const today = historyStore.getToday();
  if (!canUsePause(today, settings)) {
    return { ok: false, error: currentCopy().errors.pauseLimit };
  }

  historyStore.recordPauseUsed({ reason: 'extend-break', sessionId: timerState.sessionId });
  timerState.phase = timerState.breakKind || 'shortBreak';
  timerState.startedAt = Date.now();
  timerState.endsAt = Date.now() + FIVE_MINUTES_MS;
  timerState.breakMinutes = 5;
  persistTimerState();
  if (currentOverlayPayload) currentOverlayPayload.state = publicState();
  startTicker();
  return { ok: true, state: publicState() };
}

function snoozeFocus() {
  if (timerState.phase !== 'focus') {
    return { ok: false, error: currentCopy().errors.focusOnly };
  }

  const settings = settingsStore.load();
  const today = historyStore.getToday();
  if (!canUsePause(today, settings)) {
    return { ok: false, error: currentCopy().errors.pauseLimit };
  }

  historyStore.recordPauseUsed({ reason: 'snooze-focus', sessionId: timerState.sessionId });
  timerState.endsAt += FIVE_MINUTES_MS;
  persistTimerState();
  broadcastState();
  return { ok: true, state: publicState() };
}

function buildTrayMenu() {
  if (!tray) return;
  const state = publicState();
  const copy = currentCopy();
  const minutes = Math.ceil(state.remainingMs / 60000);
  const phaseLabel = copy.phaseNames[state.phase] || state.phase;
  const label = state.phase === 'idle' ? phaseLabel : `${phaseLabel} · ${minutes}m`;

  tray.setToolTip(`Domodoro - ${label}`);
  const actionHandlers = {
    snooze: { label: copy.tray.snooze, click: snoozeFocus },
    continue: { label: copy.tray.continue, click: continueAfterBreak },
    finish: { label: copy.tray.finish, click: finishDay },
    extend: { label: copy.tray.extend, click: extendBreak }
  };
  const phaseActions = trayActionIdsForPhase(timerState.phase).map((id) => actionHandlers[id]);
  const template = [
    { label: `${copy.tray.status}: ${label}`, enabled: false },
    ...(phaseActions.length ? [...phaseActions, { type: 'separator' }] : [{ type: 'separator' }]),
    { label: copy.tray.open, click: () => createSettingsWindow('focus') },
    { label: copy.tray.insights, click: () => createSettingsWindow('insights') },
    { label: copy.tray.armory, click: () => createSettingsWindow('armory') },
    { type: 'separator' },
    { label: copy.tray.quit, enabled: !isOverlayBlockingPhase(), click: () => { isQuitting = true; app.quit(); } }
  ];
  trayMenu = Menu.buildFromTemplate(template);
}

function registerIpc() {
  ipcMain.handle('app:get-init', () => getInitPayload());
  ipcMain.handle('timer:start-focus', () => startFocus());
  ipcMain.handle('timer:start-preset', (_event, presetId, context) => startPreset(presetId, context));
  ipcMain.handle('timer:snooze-focus', () => snoozeFocus());
  ipcMain.handle('timer:continue-after-break', () => continueAfterBreak());
  ipcMain.handle('timer:finish-day', () => finishDay());
  ipcMain.handle('timer:extend-break', () => extendBreak());
  ipcMain.handle('overlay:get-payload', () => currentOverlayPayload);
  ipcMain.handle('analytics:get-dashboard', (_event, days = 30) => (
    buildAnalytics(historyStore.load(), historyStore.getRange(days))
  ));
  ipcMain.handle('history:record-outcome', (_event, outcome) => (
    historyStore.recordOutcome({ sessionId: timerState.sessionId, outcome })
  ));
  ipcMain.handle('social:get-state', async () => socialService.getState());
  ipcMain.handle('social:request-email-code', async (_event, email) => socialService.requestEmailCode(email));
  ipcMain.handle('social:verify-email-code', async (_event, email, token) => socialService.verifyEmailCode(email, token));
  ipcMain.handle('social:start-github', async () => socialService.startGithubLogin());
  ipcMain.handle('social:sign-out', async () => socialService.signOut());
  ipcMain.handle('social:update-profile', async (_event, displayName) => socialService.updateProfile(displayName));
  ipcMain.handle('social:create-squad', async (_event, name) => socialService.createSquad(name));
  ipcMain.handle('social:join-squad', async (_event, inviteCode) => socialService.joinSquad(inviteCode));
  ipcMain.handle('social:sync-today', async () => {
    const today = historyStore.getToday();
    const analytics = buildAnalytics(historyStore.load(), [today]);
    return socialService.syncDailySummary({ ...today, ...(analytics.days[0] || {}) });
  });
  ipcMain.handle('share:save-card', async (_event, dataUrl) => {
    const match = String(dataUrl || '').match(/^data:image\/png;base64,(.+)$/);
    if (!match) return { ok: false, error: 'Invalid image data.' };
    const result = await dialog.showSaveDialog(settingsWindow, {
      title: 'Save Domodoro weekly card',
      defaultPath: `Domodoro-week-${new Date().toISOString().slice(0, 10)}.png`,
      filters: [{ name: 'PNG image', extensions: ['png'] }]
    });
    if (result.canceled || !result.filePath) return { ok: false, canceled: true };
    fs.writeFileSync(result.filePath, Buffer.from(match[1], 'base64'));
    return { ok: true, filePath: result.filePath };
  });

  ipcMain.handle('settings:save', (_event, payload) => {
    const nextPayload = { ...payload };
    if (nextPayload.controls?.bypassPasswordPlain) {
      nextPayload.controls = {
        ...nextPayload.controls,
        bypassPasswordHash: hashPassword(nextPayload.controls.bypassPasswordPlain)
      };
      delete nextPayload.controls.bypassPasswordPlain;
    }

    if (nextPayload.overlay?.videoUrl) {
      const enabled = new Set(nextPayload.overlay.enabledPackIds || settingsStore.load().overlay.enabledPackIds);
      enabled.add('custom-video');
      nextPayload.overlay.enabledPackIds = [...enabled];
    }

    const settings = settingsStore.save(nextPayload);
    setStartup(settings.app.startupEnabled);
    broadcastState();
    return getInitPayload();
  });

  ipcMain.handle('overlay:bypass', (_event, payload) => {
    if (!isOverlayBlockingPhase()) return { ok: true };
    const settings = settingsStore.load();
    const errors = copyForLanguage(settings.app.language).errors;
    const reason = String(payload?.reason || '').trim();
    if (!reason) return { ok: false, error: errors.reasonRequired };
    if (!settings.controls.bypassPasswordHash) {
      return { ok: false, error: errors.passwordMissing };
    }
    if (!verifyPassword(payload?.password || '', settings.controls.bypassPasswordHash)) {
      return { ok: false, error: errors.passwordWrong };
    }
    finishBreak({ bypassed: true, reason });
    return { ok: true };
  });
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.domodoro.app');
  settingsStore = createSettingsStore(app.getPath('userData'));
  historyStore = createHistoryStore(app.getPath('userData'));
  sessionStateStore = createSessionStateStore(app.getPath('userData'));
  socialService = createSocialService({
    dataDir: app.getPath('userData'),
    safeStorage,
    openExternal: (url) => shell.openExternal(url),
    configPath: path.join(app.getAppPath(), 'src/config/social-config.json')
  });
  if (pendingAuthCallback) socialService.handleAuthCallback(pendingAuthCallback).catch(() => {});
  Object.assign(timerState, sessionStateStore.load() || {});
  setStartup(settingsStore.load().app.startupEnabled);
  registerIpc();

  tray = new Tray(trayIcon());
  tray.on('click', () => createSettingsWindow('focus'));
  tray.on('right-click', () => {
    buildTrayMenu();
    if (trayMenu) tray.popUpContextMenu(trayMenu);
  });
  buildTrayMenu();
  createSettingsWindow();

  if (timerState.phase === 'focus') {
    startTicker();
    if (remainingMs() <= 0) tick();
  } else if (isOverlayBlockingPhase()) {
    const settings = settingsStore.load();
    const packs = loadPacks(settings);
    const selectedPack = resolveOverlayPack(
      packs.find((pack) => pack.id === timerState.currentPackId),
      packs,
      settings
    );
    const fallbackPack = resolveOverlayPack(
      packs.find((pack) => pack.id === settings.overlay.fallbackPackId),
      packs,
      settings
    );
    currentOverlayPayload = createOverlayPayload(timerState.breakKind || 'shortBreak', settings, selectedPack, fallbackPack);
    createOverlayWindows(currentOverlayPayload);
    if (isBreakPhase()) {
      startTicker();
      if (remainingMs() <= 0) tick();
    } else {
      broadcastState();
    }
  }

  app.on('activate', createSettingsWindow);
});

app.on('before-quit', (event) => {
  if (isOverlayBlockingPhase() && !isQuitting) event.preventDefault();
});

app.on('window-all-closed', () => {});

function receiveAuthCallback(url) {
  if (!String(url || '').startsWith('domodoro://auth/')) return;
  pendingAuthCallback = url;
  socialService?.handleAuthCallback(url).then(() => {
    if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.webContents.send('social:changed');
  }).catch(() => {});
}

if (process.defaultApp && process.argv[1]) {
  app.setAsDefaultProtocolClient('domodoro', process.execPath, [path.resolve(process.argv[1])]);
} else {
  app.setAsDefaultProtocolClient('domodoro');
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    receiveAuthCallback(argv.find((value) => String(value).startsWith('domodoro://')));
    createSettingsWindow();
  });
}
app.on('open-url', (event, url) => { event.preventDefault(); receiveAuthCallback(url); });
