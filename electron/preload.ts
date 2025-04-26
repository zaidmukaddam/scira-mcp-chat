import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel: string, data: unknown) =>
      ipcRenderer.send(channel, data),
    on: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) =>
      ipcRenderer.on(channel, listener),
  },
  // Add new API for executing Python scripts
  python: {
    execute: (scriptPath: string, args: string[] = []) =>
      ipcRenderer.invoke('execute-python', scriptPath, args),
  },
  // Add new API for executing Node scripts
  node: {
    execute: (scriptPath: string, args: string[] = []) =>
      ipcRenderer.invoke('execute-node', scriptPath, args),
  },
  // Add API for accessing environment variables
  env: {
    get: (name: string) => ipcRenderer.invoke('get-env-var', name)
  }
})