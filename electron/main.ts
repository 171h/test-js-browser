import { app, BrowserWindow } from 'electron'

app.whenReady().then(() => {
  console.log('process.env.VITE_DEV_SERVER_URL', process.env.VITE_DEV_SERVER_URL)
  new BrowserWindow().loadURL(process.env.VITE_DEV_SERVER_URL)
})
