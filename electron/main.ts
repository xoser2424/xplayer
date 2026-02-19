import { app, BrowserWindow, ipcMain, shell } from 'electron'
import axios from 'axios'
import { fileURLToPath } from 'node:url'
import https from 'node:https'
import path from 'node:path'
 

app.disableHardwareAcceleration()
app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('ignore-gpu-blacklist')
app.commandLine.appendSwitch('enable-unsafe-swiftshader')
app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor')
app.commandLine.appendSwitch('disable-software-rasterizer', 'false')
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-dev-shm-usage')

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
process.env.DIST_ELECTRON = path.join(__dirname, '../dist-electron')
process.env.DIST = path.join(__dirname, '../dist')
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(__dirname, '../public')
  : process.env.DIST

let win: BrowserWindow | null = null
const preload = process.env.VITE_DEV_SERVER_URL
  ? path.join(__dirname, '../electron/preload.cjs')
  : path.join(__dirname, '../dist-electron/preload.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = path.join(process.env.DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: 'XPlayer',
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 576,
    frame: false, // Frameless for custom UI
    backgroundColor: '#0b0b0f',
    icon: path.join(process.env.PUBLIC ?? __dirname, 'favicon.ico'),
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
      webSecurity: false,
      allowRunningInsecureContent: false
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    await win.loadURL(url!)
    win.webContents.openDevTools() // Open DevTools for debugging
  } else {
    await win.loadFile(indexHtml)
  }

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
  
  // IPC Handlers
  ipcMain.handle('minimize-window', () => win?.minimize());
  ipcMain.handle('maximize-window', () => {
    if (!win) return
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });
  ipcMain.handle('close-window', () => win?.close());
  ipcMain.handle('xtream:get', async (_event, fullUrl: string) => {
    const httpsAgent = new https.Agent({ rejectUnauthorized: false });
    try {
      const res = await axios.get(fullUrl, {
        timeout: 20000,
        httpsAgent,
        validateStatus: () => true,
        headers: { 'User-Agent': 'XPlayer/1.0' }
      });
      if (res.status >= 200 && res.status < 300) return res.data;
      throw new Error(`HTTP ${res.status}`);
    } catch (e: any) {
      const err: any = new Error(e?.message || 'Network error');
      // surface code for renderer
      err.code = e?.code;
      throw err;
    }
  });
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length === 0) {
    createWindow()
  } else {
    allWindows[0].focus()
  }
})
