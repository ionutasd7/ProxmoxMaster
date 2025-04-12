const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');
const { spawn } = require('child_process');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.ico')
  });

  // Load the index.html of the app.
  mainWindow.loadFile('index.html');

  // Open the DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for communication with renderer process
ipcMain.handle('ping', async (event, arg) => {
  const { exec } = require('child_process');
  return new Promise((resolve, reject) => {
    exec(`ping -c 1 ${arg}`, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, message: error.message });
        return;
      }
      resolve({ success: true, message: stdout });
    });
  });
});

// Handle SSH operations through electron
ipcMain.handle('ssh-command', async (event, args) => {
  const { host, username, password, command } = args;
  const { Client } = require('ssh2');
  
  return new Promise((resolve, reject) => {
    const conn = new Client();
    
    conn.on('ready', () => {
      conn.exec(command, (err, stream) => {
        if (err) {
          conn.end();
          reject(err);
          return;
        }
        
        let data = '';
        stream.on('data', (chunk) => {
          data += chunk;
        });
        
        stream.on('close', (code, signal) => {
          conn.end();
          resolve({ code, data });
        });
      });
    }).on('error', (err) => {
      reject(err);
    }).connect({
      host,
      port: 22,
      username,
      password
    });
  });
});

// Handle saving configuration
ipcMain.handle('save-config', async (event, config) => {
  const userDataPath = app.getPath('userData');
  const configPath = path.join(userDataPath, 'config.json');
  
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Handle loading configuration
ipcMain.handle('load-config', async (event) => {
  const userDataPath = app.getPath('userData');
  const configPath = path.join(userDataPath, 'config.json');
  
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return { success: true, config };
    } else {
      return { success: false, error: 'Config file does not exist' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});
