const path = require('node:path');
const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } = require('electron');

const { createSettingsStore } = require('../core/settingsStore');
const { createHistoryStore } = require('../core/historyStore');
const { selectOverlayPack, resolveOverlayPack } = require('../core/overlayEngine');
const { loadOverlayPacks } = require('../core/overlayPacks');
const { hashPassword, verifyPassword } = require('../core/password');
const { nextBreakKind, canUsePause, getPreset, breakCompletionPhase } = require('../core/timerRules');
const { BREAK_REWARD_POINTS, buildDisciplineProfile } = require('../core/rewardRules');
const { personaForSession, personaStageForPhase, personaUnlockPreview } = require('../core/personaStage');
const { overlayRitualForPhase } = require('../core/overlayRitual');
const { PRE_BREAK_WARNING_MS, shouldOpenPreBreakWarning, shouldResetPreBreakWarning } = require('../core/preBreakWarning');
const { copyForLanguage, normalizeLanguage } = require('../core/i18n');

const FIVE_MINUTES_MS = 5 * 60 * 1000;

let settingsStore;
let historyStore;
let tray;
let settingsWindow;
let ticker;
let isQuitting = false;
let overlayWindows = [];
let currentOverlayPayload = null;
let allowOverlayClose = false;
let warningWindow;
let warningShownForFocus = false;

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
  activePersonaIndex: 0
};

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
  return {
    settings,
    language,
    copy,
    packs: loadPacks(settings).map(({ packDir, ...pack }) => pack),
    personaLines: copy.personaLines,
    today,
    discipline,
    unlockPreview: personaUnlockPreview(discipline.score),
    state: publicState()
  };
}

function createSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 980,
    height: 760,
    minWidth: 860,
    minHeight: 660,
    title: 'Domodoro',
    icon: windowIcon(),
    backgroundColor: '#0b1020',
    webPreferences: {
      preload: appPaths().preload,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  settingsWindow.setMenuBarVisibility(false);
  settingsWindow.loadFile(appPaths().settingsHtml);
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
  stopTickerIfIdle();
  broadcastState();
}

function beginFocus({ focusMinutes, selectedPresetId = timerState.selectedPresetId }) {
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
  warningShownForFocus = false;
  closeWarningWindow();
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

function startPreset(presetId) {
  const settings = settingsStore.save({ timer: { selectedPresetId: presetId } });
  const preset = getPreset(settings, presetId);
  return beginFocus({
    focusMinutes: preset.focusMinutes,
    selectedPresetId: presetId
  });
}

function startBreak(kind) {
  closeWarningWindow();
  warningShownForFocus = false;
  const settings = settingsStore.load();
  const copy = copyForLanguage(settings.app.language);
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

  currentOverlayPayload = {
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
  createOverlayWindows(currentOverlayPayload);
  startTicker();
}

function finishBreak({ bypassed = false, reason = '' } = {}) {
  const packId = timerState.currentPackId;
  const minutes = timerState.breakMinutes;

  if (bypassed) {
    historyStore.recordBypass({ reason, packId });
    closeOverlayWindows();
    resetToIdle();
  } else {
    historyStore.recordBreakComplete({ minutes, packId });
    const settings = settingsStore.load();
    settingsStore.save({
      persona: {
        rewardScore: Number(settings.persona?.rewardScore || 0) + BREAK_REWARD_POINTS
      }
    });
    timerState.phase = breakCompletionPhase({ bypassed });
    timerState.startedAt = null;
    timerState.endsAt = null;
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
    historyStore.recordFocusComplete({ minutes: timerState.focusMinutes || settings.timer.focusMinutes });
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

  historyStore.recordPauseUsed({ reason: 'extend-break' });
  timerState.phase = timerState.breakKind || 'shortBreak';
  timerState.startedAt = Date.now();
  timerState.endsAt = Date.now() + FIVE_MINUTES_MS;
  timerState.breakMinutes = 5;
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

  historyStore.recordPauseUsed({ reason: 'snooze-focus' });
  timerState.endsAt += FIVE_MINUTES_MS;
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
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: `${copy.tray.status}: ${label}`, enabled: false },
    { type: 'separator' },
    { label: copy.tray.start, enabled: !isOverlayBlockingPhase(), click: startFocus },
    { label: copy.tray.snooze, enabled: timerState.phase === 'focus', click: snoozeFocus },
    { label: copy.tray.continue, enabled: isDecisionPhase(), click: continueAfterBreak },
    { label: copy.tray.finish, enabled: isDecisionPhase(), click: finishDay },
    { label: copy.tray.extend, enabled: isDecisionPhase(), click: extendBreak },
    { label: copy.tray.settings, click: createSettingsWindow },
    { type: 'separator' },
    { label: copy.tray.quit, enabled: !isOverlayBlockingPhase(), click: () => { isQuitting = true; app.quit(); } }
  ]));
}

function registerIpc() {
  ipcMain.handle('app:get-init', () => getInitPayload());
  ipcMain.handle('timer:start-focus', () => startFocus());
  ipcMain.handle('timer:start-preset', (_event, presetId) => startPreset(presetId));
  ipcMain.handle('timer:snooze-focus', () => snoozeFocus());
  ipcMain.handle('timer:continue-after-break', () => continueAfterBreak());
  ipcMain.handle('timer:finish-day', () => finishDay());
  ipcMain.handle('timer:extend-break', () => extendBreak());
  ipcMain.handle('overlay:get-payload', () => currentOverlayPayload);

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
  setStartup(settingsStore.load().app.startupEnabled);
  registerIpc();

  tray = new Tray(trayIcon());
  tray.on('double-click', createSettingsWindow);
  buildTrayMenu();
  createSettingsWindow();

  app.on('activate', createSettingsWindow);
});

app.on('before-quit', (event) => {
  if (isOverlayBlockingPhase() && !isQuitting) event.preventDefault();
});

app.on('window-all-closed', () => {});
