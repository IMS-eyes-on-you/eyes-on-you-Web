const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

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

    // 웹 페이지 로드
    mainWindow.loadURL('http://220.149.128.13:8888');

    // JAR 파일 경로 설정
    const jarPath = path.join(app.getAppPath(), 'resources', 'resources', 'TobiiStreamEngineForJava-4.0.jar');

    // JAR 파일 실행
    const child = spawn('java', ['-jar', jarPath]);

    child.stdout.on('data', (data) => {
        mainWindow.webContents.send('jar-output', data.toString());
    });

    child.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
        mainWindow.webContents.send('jar-error', data.toString());
    });

    child.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        mainWindow.webContents.send('jar-exit', `Process exited with code ${code}`);
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (mainWindow === null) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
