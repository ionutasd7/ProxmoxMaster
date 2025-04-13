/**
 * Proxmox Manager - Electron Main Process
 * Handles application lifecycle and creates browser windows
 */
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');
const fs = require('fs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Keep a global reference of the window objects to prevent garbage collection
let mainWindow = null;
let splashWindow = null;
let serverProcess = null;

/**
 * Creates the splash screen window
 */
const createSplashWindow = () => {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 300,
    transparent: true,
    frame: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  splashWindow.loadFile(path.join(__dirname, 'client/splash.html'));
};

/**
 * Creates the main application window
 */
const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    icon: path.join(__dirname, 'assets/app-icon.png')
  });

  // Load the app from development server or from local files
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, 'client/index.html')}`;
  mainWindow.loadURL(startUrl);

  // Once the main window is ready, close splash screen and show main window
  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
    }
    mainWindow.show();
    mainWindow.focus();
  });

  // Handle main window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

/**
 * Starts the Express server
 */
const startServer = () => {
  // In production, use the bundled server
  // In development, use the source file
  const serverPath = app.isPackaged
    ? path.join(process.resourcesPath, 'server/index.js')
    : path.join(__dirname, 'server/index.js');

  // Make sure the server file exists
  if (!fs.existsSync(serverPath)) {
    dialog.showErrorBox(
      'Server Error',
      `Could not find server file at ${serverPath}. Please reinstall the application.`
    );
    app.quit();
    return;
  }

  // Spawn the server process
  serverProcess = spawn(process.execPath, [serverPath], {
    stdio: 'pipe',
    env: { ...process.env, ELECTRON: 'true' }
  });

  // Handle server process output
  serverProcess.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`Server error: ${data}`);
  });

  // Handle server process exit
  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
    if (code !== 0) {
      dialog.showErrorBox(
        'Server Error',
        `The server process exited unexpectedly with code ${code}. Please restart the application.`
      );
    }
    serverProcess = null;
  });
};

// Application lifecycle events
app.on('ready', () => {
  createSplashWindow();
  startServer();
  
  // Give the server a moment to start before launching the main window
  setTimeout(createMainWindow, 1500);
});

app.on('window-all-closed', () => {
  // On macOS, applications keep running until explicitly quit
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create the window when dock icon is clicked with no windows open
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on('before-quit', () => {
  // Kill the server process before quitting
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});

// IPC Events
ipcMain.on('app-restart', () => {
  app.relaunch();
  app.exit();
});