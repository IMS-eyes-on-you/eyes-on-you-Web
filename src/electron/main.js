const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
// jar file 경로, main.js를 기준으로 한 상대 경로
const jarPath = path.join(__dirname, 'TobiiStreamEngineForJava-4.0.jar');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    // root URL
    mainWindow.loadURL('http://220.149.128.13:8080');

    // Tobii JAR 파일 실행
    const child = spawn('java', ['-jar', jarPath]);

    child.stdout.on('data', (data) => {
        mainWindow.webContents.send('jar-output', data.toString());
    });

    child.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    child.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });
}

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
