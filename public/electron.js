const { app, BrowserWindow, ipcMain,desktopCapturer, session} = require('electron');
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
    mainWindow.loadURL('http://localhost:3000');

    // JAR 파일 경로 수정 (빌드 후 루트 경로에 위치)
    const jarPath = path.join(__dirname, 'TobiiStreamEngineForJava-4.0.jar');
    console.log(`Attempting to execute JAR at: ${jarPath}`);

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
    ipcMain.handle('CREATE_WEBRTC_PEER', (event, options) => {
        return new kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options);
    });

    function handleStream (stream) {
        document.querySelector('video').src = URL.createObjectURL(stream)
    }

    function handleError (e) {
        console.log(e)
    }

}

app.whenReady().then(() => {
    createWindow();

    session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
        desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
          callback({ video: sources[0], audio: 'loopback' })
        })
      }, { useSystemPicker: true })

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

app.commandLine.appendSwitch('ignore-certificate-errors')
app.commandLine.appendSwitch('allow-insecure-localhost', 'true')


