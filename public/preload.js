const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electron', {
    tobiiJarOutput: (callback) => ipcRenderer.on('jar-output', (event, data) => callback(data)),
    createWebRtcPeer: (options) => ipcRenderer.invoke('CREATE_WEBRTC_PEER', options)
});