const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('breaklock', {
  getInit: () => ipcRenderer.invoke('app:get-init'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  startFocus: () => ipcRenderer.invoke('timer:start-focus'),
  startPreset: (presetId) => ipcRenderer.invoke('timer:start-preset', presetId),
  snoozeFocus: () => ipcRenderer.invoke('timer:snooze-focus'),
  continueAfterBreak: () => ipcRenderer.invoke('timer:continue-after-break'),
  finishDay: () => ipcRenderer.invoke('timer:finish-day'),
  extendBreak: () => ipcRenderer.invoke('timer:extend-break'),
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
