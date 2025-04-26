import { app, shell, BrowserWindow, ipcMain } from "electron"
import { createServer } from "http"
import path from "path"
import next from "next"
import dotenv from "dotenv"
import { spawn } from "child_process"
import fs from "fs"
import { parse } from "url"

// Load environment variables, but don't crash if file is missing
try {
  dotenv.config({
    path: app.isPackaged
      ? path.join(process.resourcesPath, ".env.local")
      : path.resolve(process.cwd(), ".env.local")
  })
  console.log("Loaded .env.local file")
} catch (error) {
  console.warn("Failed to load .env.local file, continuing anyway:", error)
}

const PORT = process.env.PORT || "3033"

const startNextApp = async () => {
  try {
    const nextPort = parseInt(PORT, 10)
    const webDir = path.join(app.getAppPath(), ".next")
    console.log("Next.js app directory:", webDir)

    const nextApp = next({
      dev: false,
      dir: app.getAppPath(),
      hostname: "localhost",
      port: nextPort,
      turbopack: true
    })
    const handle = nextApp.getRequestHandler()

    await nextApp.prepare()

    const server = createServer((req, res) => {
      // Parse the URL using the url module as shown in Next.js docs
      const parsedUrl = parse(req.url || '/', true)
      console.log(`Request received: ${parsedUrl.pathname}`)
      handle(req, res, parsedUrl)
    })
    
    server.listen(nextPort, () => {
      console.log(`Next.js server listening on port ${nextPort}`)
    })

  } catch (error) {
    console.error(`Error starting NextJS Server: ${error}`)
    throw error
  }
}

// Keep track of the main window to prevent multiple windows
let mainWindow: BrowserWindow | null = null

const createMainWindow = () => {
  // If window already exists, focus it instead of creating a new one
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
    return mainWindow
  }

  mainWindow = new BrowserWindow({
    title: "Scira MCP Chat",
    width: 1600,
    height: 1024,
    center: true,
    backgroundColor: "#0A0A0A",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    }
  })

  const loadURL = async () => {
    if (!app.isPackaged) {
      console.log("Development mode: Loading from localhost:3000")
      mainWindow?.loadURL("http://localhost:3000")
    } else {
      try {
        console.log("Production mode: Starting internal Next.js server")
        await startNextApp()

        const nextServerURL = `http://localhost:${PORT}`
        console.log(`Loading from ${nextServerURL}`)
        mainWindow?.loadURL(nextServerURL)

      } catch (error: unknown) {
        console.error(`Error initializing server: ${error}`)
        // Show error in the window
        const errorMessage = error instanceof Error ? error.message : String(error)
        mainWindow?.loadURL(`data:text/html,<html><body><h1>Error</h1><p>${errorMessage}</p></body></html>`)
      }
    }
  }
  loadURL()

  mainWindow.on("ready-to-show", () => {
    mainWindow?.show()
  })

  mainWindow.on("closed", () => {
    mainWindow = null
  })

  const isInternalUrl = (url: string) => url.startsWith("http://localhost")
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!isInternalUrl(url)) {
      shell.openExternal(url)
      return { action: "deny" }
    }
    return { action: "allow" }
  })
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!isInternalUrl(url)) {
      shell.openExternal(url)
      event.preventDefault()
    }
  })

  return mainWindow
}

// Initialize file logger
function initLogger() {
  // Use a writable directory for logs (works in packaged apps)
  const userDataPath = app.getPath('userData');
  const logDir = path.join(userDataPath, 'logs');
  fs.mkdirSync(logDir, { recursive: true });
  const logPath = path.join(logDir, 'main.log');
  console.log(`Main process log file: ${logPath}`);
  const logStream = fs.createWriteStream(logPath, { flags: 'a' });
  const write = (level: string, args: any[]) => {
    const msg = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
    logStream.write(`[${level}] [${new Date().toISOString()}] ${msg}\n`);
  };
  const origLog = console.log;
  console.log = (...args: any[]) => { write('INFO', args); origLog.apply(console, args); };
  const origWarn = console.warn;
  console.warn = (...args: any[]) => { write('WARN', args); origWarn.apply(console, args); };
  const origError = console.error;
  console.error = (...args: any[]) => { write('ERROR', args); origError.apply(console, args); };
}

app.whenReady().then(() => {
  initLogger();
  createMainWindow()
  
  // Setup IPC handlers for executing commands
  setupCommandHandlers()
  
  app.on("activate", () => {
    // On macOS it's common to re-create a window when the dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

// Setup handlers for executing Python and Node commands
function setupCommandHandlers() {
  // Execute Python script
  ipcMain.handle('execute-python', async (event, scriptPath, args = []) => {
    try {
      const pythonProcess = spawn('python', [scriptPath, ...args], {
        env: process.env,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      return new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';
        
        pythonProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            reject({ code, stderr });
          } else {
            resolve({ code, stdout });
          }
        });
        
        pythonProcess.on('error', (err) => {
          reject({ error: err.message });
        });
      });
    } catch (error: any) {
      console.error('Failed to execute Python script:', error);
      return { error: error.message };
    }
  });
  
  // Execute Node package/script
  ipcMain.handle('execute-node', async (event, scriptPath, args = []) => {
    try {
      const nodeProcess = spawn('node', [scriptPath, ...args], {
        env: process.env,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      return new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';
        
        nodeProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });
        
        nodeProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });
        
        nodeProcess.on('close', (code) => {
          if (code !== 0) {
            reject({ code, stderr });
          } else {
            resolve({ code, stdout });
          }
        });
        
        nodeProcess.on('error', (err) => {
          reject({ error: err.message });
        });
      });
    } catch (error: any) {
      console.error('Failed to execute Node script:', error);
      return { error: error.message };
    }
  });
  
  // Get environment variables
  ipcMain.handle('get-env-var', (event, name) => {
    return process.env[name];
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})