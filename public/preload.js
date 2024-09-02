const { contextBridge, ipcRenderer } = require('electron');

// Electron의 IPC(Inter Process Communication) 모듈이용
// tobii jar 파일 output 값을 ipc 랜더러 프로세스로 전달
contextBridge.exposeInMainWorld('electron', {
    tobiiJarOutput: (callback) => ipcRenderer.on('jar-output', (event, data) => callback(data))
});
