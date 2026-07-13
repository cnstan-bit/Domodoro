const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('breaklock', {
  getInit: () => ipcRenderer.invoke('app:get-init'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  startFocus: () => ipcRenderer.invoke('timer:start-focus'),
  startPreset: (presetId, context) => ipcRenderer.invoke('timer:start-preset', presetId, context),
  snoozeFocus: () => ipcRenderer.invoke('timer:snooze-focus'),
  continueAfterBreak: () => ipcRenderer.invoke('timer:continue-after-break'),
  finishDay: () => ipcRenderer.invoke('timer:finish-day'),
  extendBreak: () => ipcRenderer.invoke('timer:extend-break'),
  getAnalytics: (days) => ipcRenderer.invoke('analytics:get-dashboard', days),
  recordOutcome: (outcome) => ipcRenderer.invoke('history:record-outcome', outcome),
  getSocialState: () => ipcRenderer.invoke('social:get-state'),
  requestEmailCode: (email) => ipcRenderer.invoke('social:request-email-code', email),
  verifyEmailCode: (email, token) => ipcRenderer.invoke('social:verify-email-code', email, token),
  startGithubLogin: () => ipcRenderer.invoke('social:start-github'),
  signOutSocial: () => ipcRenderer.invoke('social:sign-out'),
  updateSocialProfile: (displayName) => ipcRenderer.invoke('social:update-profile', displayName),
  createSquad: (name) => ipcRenderer.invoke('social:create-squad', name),
  joinSquad: (inviteCode) => ipcRenderer.invoke('social:join-squad', inviteCode),
  syncToday: () => ipcRenderer.invoke('social:sync-today'),
  saveShareCard: (dataUrl) => ipcRenderer.invoke('share:save-card', dataUrl),
  onSocialChanged: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('social:changed', listener);
    return () => ipcRenderer.removeListener('social:changed', listener);
  },
  onNavigate: (callback) => {
    const listener = (_event, route) => callback(route);
    ipcRenderer.on('app:navigate', listener);
    return () => ipcRenderer.removeListener('app:navigate', listener);
  },
  onState: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('timer:state', listener);
    return () => ipcRenderer.removeListener('timer:state', listener);
  }
});

contextBridge.exposeInMainWorld('breaklockOverlay', {
  getPayload: () => ipcRenderer.invoke('overlay:get-payload'),
  bypass: (payload) => ipcRenderer.invoke('overlay:bypass', payload)
});
