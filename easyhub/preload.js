'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hub', {
  getState: () => ipcRenderer.invoke('hub:getState'),
  reload: () => ipcRenderer.invoke('hub:reload'),
  setScene: (id) => ipcRenderer.invoke('hub:setScene', id),
  quit: () => ipcRenderer.invoke('hub:quit'),
  onEvent: (cb) => ipcRenderer.on('hub:event', (_e, payload) => cb(payload))
});
