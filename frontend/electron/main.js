// Placeholder del proceso principal de Electron para empaquetar el frontend
// como app de escritorio (Windows/Linux/macOS). No es funcional todavía:
//
//   npm install --save-dev electron electron-builder
//   npm run build
//   npx electron electron/main.js
//
// Agregar un script "electron:start" / "electron:build" en package.json
// una vez instaladas las dependencias. Ver https://www.electronjs.org/docs.

const path = require('node:path')
const { app, BrowserWindow } = require('electron')

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
