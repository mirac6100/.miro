const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('player.html');
}

// Single instance lock (Windows için)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Birisi uygulamayı ikinci kez açmaya çalıştığında
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      
      // Komut satırından dosya yolu al
      const miroFile = commandLine.find(arg => arg.endsWith('.miro'));
      if (miroFile) {
        mainWindow.webContents.send('open-miro', miroFile);
      }
    }
  });

  app.whenReady().then(() => {
    createWindow();
    
    // Uygulama başlatıldığında komut satırı argümanlarını kontrol et
    const args = process.argv;
    const miroFile = args.find(arg => arg.endsWith('.miro'));
    
    if (miroFile) {
      mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.webContents.send('open-miro', miroFile);
      });
    }
  });
}

// macOS için dosya açma eventi
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  if (mainWindow) {
    mainWindow.webContents.send('open-miro', filePath);
  } else {
    // Pencere henüz açılmamışsa, açıldıktan sonra dosyayı gönder
    app.whenReady().then(() => {
      createWindow();
      mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.webContents.send('open-miro', filePath);
      });
    });
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});