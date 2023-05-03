var import_electron = require("electron");
import_electron.app.whenReady().then(() => {
  console.log("process.env.VITE_DEV_SERVER_URL", process.env.VITE_DEV_SERVER_URL);
  new import_electron.BrowserWindow().loadURL(process.env.VITE_DEV_SERVER_URL);
});
