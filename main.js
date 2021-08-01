const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

let win;

const iconPath = process.platform !== 'darwin'
    ? 'src/assets/icons/icon.ico'
    : 'src/assets/icons/icon.icns';

function createWindow() {
  win = new BrowserWindow({
    width: 400,
    height: 600,
    resizable: false,
    icon: path.join(iconPath),
        
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  })

  win.webContents.openDevTools();
  win.setMenuBarVisibility(false);
}

  app.on('ready', () => {
    createWindow();
    win.loadFile('src/platine.html');
  })
  
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  })

  ipcMain.on('app_version', (event) => {
    event.sender.send('app_version', { version: app.getVersion() });
  });

