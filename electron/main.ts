import { app, BrowserWindow, ipcMain, shell } from 'electron'
import axios from 'axios'
import { fileURLToPath } from 'node:url'
import https from 'node:https'
import path from 'node:path'
import fs from 'node:fs'
import { spawnSync, spawn } from 'node:child_process'
 

const softRenderer = process.env.XPLAYER_SOFT_RENDERER === '1'
if (softRenderer) {
  app.disableHardwareAcceleration()
  app.commandLine.appendSwitch('disable-gpu')
  app.commandLine.appendSwitch('ignore-gpu-blacklist')
  app.commandLine.appendSwitch('enable-unsafe-swiftshader')
  app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor')
  app.commandLine.appendSwitch('disable-software-rasterizer', 'false')
  app.commandLine.appendSwitch('no-sandbox')
  app.commandLine.appendSwitch('disable-dev-shm-usage')
} else {
  // Prefer hardware acceleration by default
  app.commandLine.appendSwitch('enable-features', 'Vulkan,UseSkiaRenderer,CanvasOopRasterization,AcceleratedVideoDecode,VaapiVideoDecoder')
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
process.env.DIST_ELECTRON = path.join(__dirname, '../dist-electron')
process.env.DIST = path.join(__dirname, '../dist')
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(__dirname, '../public')
  : process.env.DIST

// Allow media autoplay without user gesture (for VOD auto-start)
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')

let win: BrowserWindow | null = null
const preload = process.env.VITE_DEV_SERVER_URL
  ? path.join(__dirname, '../electron/preload.cjs')
  : path.join(__dirname, '../dist-electron/preload.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = path.join(process.env.DIST, 'index.html')

let mpvProc: ReturnType<typeof spawn> | null = null

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
      nodeIntegration: false,
      contextIsolation: true,
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

  ipcMain.handle('mpv:play', async (_event, payload: { url: string; title?: string; fs?: boolean }) => {
    const pickExisting = (): string | null => {
      if (process.platform === 'win32') {
        const fixed = 'C:\\\\Users\\\\ÖZDE-SUDE\\\\scoop\\\\apps\\\\mpv\\\\current\\\\mpv.exe';
        return fixed;
      }
      return 'mpv';
    };
    const exe = pickExisting();
    const args = [];
    if (payload.title) args.push(`--title=${payload.title}`);
    if (payload.fs !== false) args.push('--fs');
    args.push(payload.url);
    const child = spawn(exe, args, { detached: true, stdio: 'ignore', windowsHide: true });
    child.unref();
    return true;
  });

  const stopMpv = () => {
    if (mpvProc && !mpvProc.killed) {
      try { mpvProc.kill(); } catch {}
    }
    mpvProc = null;
  };

  ipcMain.handle('mpv:stop', async () => {
    stopMpv();
    return true;
  });

  ipcMain.handle('mpv:playLive', async (_event, payload: { url: string; title?: string }) => {
    const exe = process.platform === 'win32'
      ? 'C:\\\\Users\\\\ÖZDE-SUDE\\\\scoop\\\\apps\\\\mpv\\\\current\\\\mpv.exe'
      : 'mpv';
    stopMpv();
    const args = [
      '--force-window=yes',
      '--no-terminal',
      '--hwdec=auto-safe',
      '--profile=fast',
      '--cache=yes',
      '--cache-secs=30',
      '--demuxer-max-bytes=150M',
      '--demuxer-max-back-bytes=50M',
      '--demuxer-readahead-secs=20',
      '--network-timeout=10',
      '--video-sync=display-resample',
      '--audio-pitch-correction=yes',
      '--keep-open=yes',
      '--alang=tr,eng,ger,jpn,rus',
      '--slang=tr,eng',
      '--sub-auto=fuzzy',
      '--sub-file-auto=all',
    ];
    if (payload.title) args.push(`--title=${payload.title}`);
    args.push(payload.url);
    mpvProc = spawn(exe, args, { windowsHide: true });
    mpvProc.on('exit', () => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('playback-ended', { url: payload.url });
      }
      mpvProc = null;
    });
    return true;
  });

  ipcMain.handle('mpv:playVod', async (_event, payload: { url: string; title?: string }) => {
    const exe = process.platform === 'win32'
      ? 'C:\\\\Users\\\\ÖZDE-SUDE\\\\scoop\\\\apps\\\\mpv\\\\current\\\\mpv.exe'
      : 'mpv';
    stopMpv();
    const args = [
      '--force-window=yes',
      '--no-terminal',
      '--hwdec=auto-safe',
      '--profile=fast',
      '--cache=yes',
      '--cache-secs=30',
      '--demuxer-max-bytes=150M',
      '--demuxer-max-back-bytes=50M',
      '--demuxer-readahead-secs=20',
      '--network-timeout=10',
      '--video-sync=display-resample',
      '--audio-pitch-correction=yes',
      '--keep-open=yes',
      '--alang=tr,eng,ger,jpn,rus',
      '--slang=tr,eng',
      '--sub-auto=fuzzy',
      '--sub-file-auto=all',
      '--fs'
    ];
    if (payload.title) args.push(`--title=${payload.title}`);
    args.push(payload.url);
    mpvProc = spawn(exe, args, { windowsHide: true });
    mpvProc.on('exit', () => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('playback-ended', { url: payload.url });
      }
      mpvProc = null;
    });
    return true;
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
      : 'mpv';
    stopMpv();
    const args = [
      '--force-window=yes',
      '--no-terminal',
      '--hwdec=auto-safe',
      '--profile=fast',
      '--cache=yes',
      '--cache-secs=30',
      '--demuxer-max-bytes=150M',
      '--demuxer-max-back-bytes=50M',
      '--demuxer-readahead-secs=20',
      '--network-timeout=10',
      '--video-sync=display-resample',
      '--audio-pitch-correction=yes',
      '--keep-open=yes',
      '--alang=tr,eng,ger,jpn,rus',
      '--slang=tr,eng',
      '--sub-auto=fuzzy',
      '--sub-file-auto=all',
    ];
    if (payload.title) args.push(`--title=${payload.title}`);
    args.push(payload.url);
    mpvProc = spawn(exe, args, { windowsHide: true });
    mpvProc.on('exit', () => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('playback-ended', { url: payload.url });
      }
      mpvProc = null;
    });
    return true;
  });

  ipcMain.handle('mpv:playVod', async (_event, payload: { url: string; title?: string }) => {
    const exe = process.platform === 'win32'
      ? 'C:\\\\Users\\\\ÖZDE-SUDE\\\\scoop\\\\apps\\\\mpv\\\\current\\\\mpv.exe'
      : 'mpv';
    stopMpv();
    const args = [
      '--force-window=yes',
      '--no-terminal',
      '--hwdec=auto-safe',
      '--profile=fast',
      '--cache=yes',
      '--cache-secs=30',
      '--demuxer-max-bytes=150M',
      '--demuxer-max-back-bytes=50M',
      '--demuxer-readahead-secs=20',
      '--network-timeout=10',
      '--video-sync=display-resample',
      '--audio-pitch-correction=yes',
      '--keep-open=yes',
      '--alang=tr,eng,ger,jpn,rus',
      '--slang=tr,eng',
      '--sub-auto=fuzzy',
      '--sub-file-auto=all',
      '--fs'
    ];
    if (payload.title) args.push(`--title=${payload.title}`);
    args.push(payload.url);
    mpvProc = spawn(exe, args, { windowsHide: true });
    mpvProc.on('exit', () => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('playback-ended', { url: payload.url });
      }
      mpvProc = null;
    });
    return true;
  });
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  try {
    if (mpvProc && !mpvProc.killed) mpvProc.kill();
  } catch {}
});

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
