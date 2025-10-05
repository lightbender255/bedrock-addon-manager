const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const log = require('electron-log');

// Configure logging
log.transports.file.resolvePath = () => path.join(__dirname, 'logs/main.log');
log.transports.file.level = 'info';
log.info('App starting...');

// Log unhandled exceptions
process.on('uncaughtException', (error) => {
  log.error('Unhandled Exception:', error);
  app.quit();
});

const minecraftPath = path.join(process.env.LOCALAPPDATA, 'Packages', 'Microsoft.MinecraftUWP_8wekyb3d8bbwe', 'LocalState', 'games', 'com.mojang');

async function getAddonDetails(addonPath) {
  try {
    const manifestPath = path.join(addonPath, 'manifest.json');
    const manifestData = await fs.readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestData);

    const name = manifest.header.name || 'Unknown';
    const description = manifest.header.description || 'No description';
    
    let iconPath = path.join(addonPath, 'pack_icon.png');
    try {
      await fs.access(iconPath);
    } catch {
      iconPath = null; // Icon doesn't exist
    }

    return {
      name: name.replace(/§[0-9a-fklmnor]/g, ''), // Strip Minecraft color codes
      description: description.replace(/§[0-9a-fklmnor]/g, ''),
      icon: iconPath ? `file://${iconPath}` : null,
      path: addonPath
    };
  } catch (error) {
    // Could be a folder without a manifest, skip it
    log.warn(`Could not read manifest for ${addonPath}: ${error.message}`);
    return null;
  }
}

async function handleScanAddons(event, scanType) {
  const win = BrowserWindow.fromWebContents(event.sender);
  let targetPath = '';

  switch (scanType) {
    case 'premium_cache':
      // The premium_cache folder is a sibling of the 'games' folder
      targetPath = path.join(path.dirname(path.dirname(minecraftPath)), 'premium_cache');
      break;
    case 'development_behavior_packs':
      targetPath = path.join(minecraftPath, 'development_behavior_packs');
      break;
    case 'development_resource_packs':
      targetPath = path.join(minecraftPath, 'development_resource_packs');
      break;
    default:
      win.webContents.send('addon-list-update', [{ name: 'Error', description: 'Invalid scan type', icon: null }]);
      return;
  }

  try {
    log.info(`Scanning directory: ${targetPath}`);
    const entries = await fs.readdir(targetPath, { withFileTypes: true });
    const addonFolders = entries
      .filter(dirent => dirent.isDirectory())
      .map(dirent => path.join(targetPath, dirent.name));

    const addonDetailsPromises = addonFolders.map(folder => getAddonDetails(folder));
    const addonDetails = (await Promise.all(addonDetailsPromises)).filter(Boolean); // Filter out nulls

    log.info(`Found ${addonDetails.length} valid addons.`);
    win.webContents.send('addon-list-update', addonDetails);

  } catch (error) {
    log.error(`Failed to scan ${scanType}:`, error);
    win.webContents.send('addon-list-update', [{ name: 'Error', description: error.message, icon: null }]);
  }
}

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('src/index.html');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  ipcMain.handle('scan-addons', handleScanAddons);
  
  // Handle logs from renderer process
  ipcMain.on('log', (event, level, message) => {
    log[level](message);
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  log.info('All windows closed, quitting app.');
  if (process.platform !== 'darwin') app.quit();
});

// Handle IPC messages from the renderer process here
// Example:
// ipcMain.handle('some-action', async (event, ...args) => {
//   // do something
//   return result;
// });
