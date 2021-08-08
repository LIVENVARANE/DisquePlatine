const { app, BrowserWindow, ipcMain, session } = require('electron')
const path = require('path')
const fs = require('fs');
let win;

let bays = {};

const iconPath = process.platform !== 'darwin'
    ? 'src/assets/icon.ico'
    : 'src/assets/icon.icns';

const iconPathGreen = process.platform !== 'darwin'
    ? 'src/assets/iconGreen.ico'
    : 'src/assets/iconGreen.icns';

function createWindow() {
  win = new BrowserWindow({
    width: 400,
    height: 600,
    resizable: false,
    icon: path.join(iconPath),
        
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false,
      plugins: true,
    }
  })

  //win.webContents.openDevTools();
  win.setMenuBarVisibility(false);

  win.on('closed', () => {
    Object.keys(bays).forEach(function(key) {
      if(bays[key] != null) bays[key].close();
    })
    app.exit(); //yes
  });
}

  app.on('widevine-ready', () => {
    createWindow();
    win.loadFile('src/platine.html');

    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => { //set up useragent faker
      details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36';
      callback({ cancel: false, requestHeaders: details.requestHeaders });
    });
  })
  
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  ipcMain.on('app_version', (event) => {
    event.sender.send('app_version', { version: app.getVersion() });
  });

  ipcMain.on('getBayDict', (event) => {
    event.sender.send('getBayDict', { dict: JSON.stringify(bays) });
  });

  ipcMain.on('startBay', (event, data) => {
    var bayNumber = data['number'];
    win.webContents.executeJavaScript('totalBays++;');

    if(bays[bayNumber] == null) { //a bay is not already started here
      bays[bayNumber] = new BrowserWindow({
        width: 300,
        height: 200,
        //resizable: false,
        icon: path.join(iconPathGreen),
        show: false,
        
        webPreferences: {
          preload: path.join(__dirname, './bayPreload.js'),
          nodeIntegration: false,
          contextIsolation: false,
          plugins: true,
          session: session.fromPartition('session-' + bayNumber.toString()) //per bay session
        }
      });

      bays[bayNumber].webContents.debugger.attach('1.3');

      //reset session
      session.fromPartition('session-' + bayNumber.toString()).clearCache();
      session.fromPartition('session-' + bayNumber.toString()).clearStorageData();

      //set proxy
      session.fromPartition('session-' + bayNumber.toString()).setProxy({ proxyRules: data['proxy'].replace(/(\r\n|\n|\r)/gm, "") });

      //fake user agent
      session.fromPartition('session-' + bayNumber.toString()).webRequest.onBeforeSendHeaders((details, callback) => {
        //details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36';
        details.requestHeaders['User-Agent'] = 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 1.1.4322)';

        callback({ cancel: false, requestHeaders: details.requestHeaders });
      });

      //get device id
      session.fromPartition('session-' + bayNumber.toString()).webRequest.onBeforeRequest((details, callback) => {
        if(details.url.includes('spotify.com/track-playback/v1/devices')) {
          if(details.method == 'POST') { //avoid OPTIONS call
            bays[bayNumber].webContents.executeJavaScript('var deviceId = "' + JSON.parse(details.uploadData[0]['bytes'].toString('utf8'))['device']['device_id'] + '";')
          }
        }

        callback({ cancel: false });
      });

      const dcCookie = { url: 'http://open.spotify.com', name: 'sp_dc', value: 'AQDXmcb_PDRN2aQxKnCjyYySFfIgrb7ZU2XC1GVcA5Sk4l0uR3ey0tIZNjBekgWlxtTHzn0L56CeK6ymc4SX1d9pXEa6OXt2SUmUw7sNHXuUMA' }
      const keyCookie = { url: 'http://open.spotify.com', name: 'sp_key', value: '4e5a6779-b640-4870-8f39-872601286384' }
      session.fromPartition('session-' + bayNumber.toString()).cookies.set(dcCookie).then(() => {
        session.fromPartition('session-' + bayNumber.toString()).cookies.set(keyCookie).then(() => {
          bays[bayNumber].loadURL('https://open.spotify.com/?utm_source=pwa_install');
        });
      });

      //bays[bayNumber].loadURL('https://api.ipify.org/?format=json');        

      bays[bayNumber].setMenuBarVisibility(false);
      bays[bayNumber].webContents.setAudioMuted(true);
      bays[bayNumber].on('close', function (e) {
        e.preventDefault();
        bays[bayNumber].hide();
      });
      bays[bayNumber].on('page-title-updated', (event, title) => {
        if(!title.includes('Interface: n')) {
          event.preventDefault();
        }
      });
      bays[bayNumber].on('will-navigate', (event, url) => {
        event.preventDefault();
      });
      bays[bayNumber].once('ready-to-show', () => {
        bays[bayNumber].webContents.insertCSS('#dp-bay-background { font-family: \'Segoe UI\', sans-serif; overflow: hidden; text-overflow: ellipsis; }');
        var injectJS = fs.readFileSync(path.join(__dirname, './bay.js')).toString();
        setTimeout(function() {
          bays[bayNumber].webContents.executeJavaScript(injectJS);
          setTimeout(function() {
            bays[bayNumber].webContents.executeJavaScript('document.title = "Interface: n°' + bayNumber + '"; document.getElementById("bearer").setAttribute("content", "' + data['auth'] + '"); document.getElementById("track").setAttribute("content", "' + data['track'] + '"); var bayNumber = ' + bayNumber + '; loadBay();');
          }, 1000);
        }, 2000);
      });

      win.webContents.executeJavaScript('updateBayState(' + bayNumber + ', { state: "Chargement de Spotify...", windowCanBeOpened: true, bayCanBeClosed: true })');
    } else {
      win.webContents.executeJavaScript('alert("L\'interface que vous avez essayé de lancer est déjà démarrée, pour régler ce problème, la meilleure solution est de redémarrer l\'application.")');
    }
  });

  ipcMain.on('showBay', (event, data) => {
    if(bays[data] !== null) {
      bays[data].show();
    } else {
      win.webContents.executeJavaScript('alert("L\'interface que vous avez essayé d\'afficher n\'existe pas/plus, pour régler ce problème, la meilleure solution est de redémarrer l\'application.")');
    }
  });

  ipcMain.on('closeBay', (event, data) => {
    if(bays[data] !== null) {
      bays[data].close();
      bays[data] = null;
      win.webContents.executeJavaScript('updateBayState(' + data + ', { state: "DELETED" })');
    } else {
      win.webContents.executeJavaScript('alert("L\'interface que vous avez essayé de fermer n\'existe pas/plus, pour régler ce problème, la meilleure solution est de redémarrer l\'application.")');
    }
  });

  ipcMain.on('hostJS', (event, data) => {
    win.webContents.executeJavaScript(data);
  })