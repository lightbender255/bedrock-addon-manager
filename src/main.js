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

function parseLangFile(data) {
    const translations = {};
    const lines = data.split(/\r?\n/); // Split by new line for cross-platform compatibility
    for (const line of lines) {
        // Skip comments and empty lines
        if (line.trim().startsWith('#') || line.trim() === '') {
            continue;
        }
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim(); // Re-join the rest in case value has '='
            translations[key] = value;
        }
    }
    return translations;
}

const minecraftPath = path.join(process.env.LOCALAPPDATA, 'Packages', 'Microsoft.MinecraftUWP_8wekyb3d8bbwe', 'LocalState', 'games', 'com.mojang');

async function getAddonDetails(addonPath) {
  try {
    const manifestPath = path.join(addonPath, 'manifest.json');
    const manifestData = await fs.readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestData);

    let name = manifest.header.name || 'Unknown';
    let description = manifest.header.description || 'No description';

    // Check if localization is needed
    if (name.startsWith('pack.') || description.startsWith('pack.')) {
        const langPath = path.join(addonPath, 'texts', 'en_US.lang');
        try {
            const langData = await fs.readFile(langPath, 'utf8');
            const langMap = parseLangFile(langData);
            if (name.startsWith('pack.')) {
                name = langMap[name] || name;
            }
            if (description.startsWith('pack.')) {
                description = langMap[description] || description;
            }
        } catch (langError) {
            // It's okay if the lang file doesn't exist.
            // But we should log other errors.
            if (langError.code !== 'ENOENT') {
                log.warn(`Could not read or parse lang file for ${addonPath}: ${langError.message}`);
            }
        }
    }
    
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
    // Could be a folder without a manifest, or other read error.
    // Log it unless it's just a missing manifest, which is common.
    if (error.code !== 'ENOENT') {
        log.warn(`Could not get addon details for ${addonPath}: ${error.message}`);
    }
    return null;
  }
}

async function handleScanAddons(event, scanType) {
  const win = BrowserWindow.fromWebContents(event.sender);
  const targetPaths = [];

  const premiumCachePath = path.join(path.dirname(path.dirname(minecraftPath)), 'premium_cache');

  switch (scanType) {
    case 'premium_cache':
      // Scan both behavior and resource packs inside premium_cache
      targetPaths.push(path.join(premiumCachePath, 'behavior_packs'));
      targetPaths.push(path.join(premiumCachePath, 'resource_packs'));
      break;
    case 'development_behavior_packs':
      targetPaths.push(path.join(minecraftPath, 'development_behavior_packs'));
      break;
    case 'development_resource_packs':
      targetPaths.push(path.join(minecraftPath, 'development_resource_packs'));
      break;
    default:
      win.webContents.send('addon-list-update', [{ name: 'Error', description: 'Invalid scan type', icon: null }]);
      return;
  }

  try {
    const allAddonFolders = [];
    for (const targetPath of targetPaths) {
      try {
        log.info(`Scanning directory: ${targetPath}`);
        const entries = await fs.readdir(targetPath, { withFileTypes: true });
        const addonFolders = entries
          .filter(dirent => dirent.isDirectory())
          .map(dirent => path.join(targetPath, dirent.name));
        allAddonFolders.push(...addonFolders);
      } catch (e) {
        if (e.code === 'ENOENT') {
          log.warn(`Directory not found, skipping: ${targetPath}`);
        } else {
          throw e; // re-throw other errors
        }
      }
    }

    const addonDetailsPromises = allAddonFolders.map(folder => getAddonDetails(folder));
    const addonDetails = (await Promise.all(addonDetailsPromises)).filter(Boolean); // Filter out nulls

    log.info(`Found ${addonDetails.length} valid addons in ${scanType}.`);
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
