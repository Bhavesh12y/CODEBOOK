const { app, BrowserWindow, dialog, Menu } = require('electron');
const { spawn } = require('child_process');
const http = require('http');
const net = require('net');
const path = require('path');
const fs = require('fs');

let backendPort = Number(process.env.CPPBOOK_BACKEND_PORT || 0);
let apiBaseUrl = '';
let backendProcess = null;

function resourcePath(...segments) {
  return app.isPackaged
    ? path.join(process.resourcesPath, ...segments)
    : path.join(__dirname, '..', ...segments);
}

function appPath(...segments) {
  return app.isPackaged
    ? path.join(app.getAppPath(), ...segments)
    : path.join(__dirname, '..', ...segments);
}

function frontendIndexPath() {
  const candidates = app.isPackaged
    ? [appPath('dist', 'index.html')]
    : [appPath('dist', 'index.html'), appPath('frontend', 'dist', 'index.html')];
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error(`Frontend build not found. Run "npm run build" first. Checked: ${candidates.join(', ')}`);
  }
  return found;
}

function backendCommand() {
  if (app.isPackaged) {
    const exeName = process.platform === 'win32' ? 'cppbook-backend.exe' : 'cppbook-backend';
    const bundledExe = resourcePath('backend', exeName);
    if (fs.existsSync(bundledExe)) {
      if (process.platform !== 'win32') {
        try {
          fs.chmodSync(bundledExe, 0o755);
        } catch (_) {}
      }
      return { command: bundledExe, args: [] };
    }
  }

  const venvPython = process.platform === 'win32'
    ? path.join(__dirname, '..', '.venv', 'Scripts', 'python.exe')
    : path.join(__dirname, '..', '.venv', 'bin', 'python');
  const python = fs.existsSync(venvPython) ? venvPython : 'python';
  return { command: python, args: [path.join(__dirname, '..', 'backend', 'serve.py')] };
}

function findAvailablePort(preferredPort) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', (error) => {
      if (preferredPort && error.code === 'EADDRINUSE') {
        findAvailablePort(0).then(resolve, reject);
        return;
      }
      reject(error);
    });
    server.listen(preferredPort || 0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : preferredPort;
      server.close(() => resolve(port));
    });
  });
}

function waitForBackend(timeoutMs = 20000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const request = http.get(`${apiBaseUrl}/health`, (response) => {
        response.resume();
        if (response.statusCode === 200) {
          resolve();
          return;
        }
        retry();
      });
      request.on('error', retry);
      request.setTimeout(1000, () => {
        request.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - started > timeoutMs) {
        reject(new Error('CppBook backend did not start in time.'));
        return;
      }
      setTimeout(attempt, 350);
    };

    attempt();
  });
}

function startBackend() {
  const { command, args } = backendCommand();
  backendProcess = spawn(command, args, {
    env: {
      ...process.env,
      BACKEND_PORT: String(backendPort),
      CPPBOOK_BACKEND_PORT: String(backendPort),
      CPPBOOK_API_BASE_URL: apiBaseUrl,
      WORKSPACE_DIR: app.getPath('userData'),
    },
    windowsHide: true,
    stdio: app.isPackaged ? 'ignore' : 'inherit',
  });
}

async function createWindow() {
  backendPort = await findAvailablePort(backendPort || 8765);
  apiBaseUrl = `http://127.0.0.1:${backendPort}/api`;
  process.env.CPPBOOK_API_BASE_URL = apiBaseUrl;
  startBackend();
  await waitForBackend();

  Menu.setApplicationMenu(null);

  const isMac = process.platform === 'darwin';

  const window = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 980,
    minHeight: 680,
    title: 'CppBook',
    backgroundColor: '#0b0d10',
    autoHideMenuBar: true,
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    ...(isMac
      ? { trafficLightPosition: { x: 16, y: 16 } }
      : {
          titleBarOverlay: {
            color: '#00000000',
            symbolColor: '#94a3b8',
            height: 48,
          },
        }),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  window.setMenu(null);
  window.removeMenu();
  window.setMenuBarVisibility(false);

  if (process.env.CPPBOOK_ELECTRON_DEV === '1') {
    await window.loadURL('http://127.0.0.1:5173/');
  } else {
    await window.loadFile(frontendIndexPath());
  }
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow().catch((error) => {
    dialog.showErrorBox('CppBook failed to start', error.message);
    app.quit();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill();
  }
});
