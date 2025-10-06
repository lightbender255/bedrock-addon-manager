const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const log = require('electron-log');

// Configure logging
log.transports.file.path = path.join(__dirname, 'logs/main.log');
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

const bdsPath = 'C:\\game\\game_servers\\bedrock-server-1.21';
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

async function handleScanWorlds(event) {
    const win = BrowserWindow.fromWebContents(event.sender);
    const worldsPath = path.join(bdsPath, 'worlds');
    try {
        log.info(`Scanning for worlds in: ${worldsPath}`);
        const worldFolders = await fs.readdir(worldsPath, { withFileTypes: true });
        const worldDetailsPromises = worldFolders
            .filter(dirent => dirent.isDirectory())
            .map(async (dirent) => {
                const worldPath = path.join(worldsPath, dirent.name);
                const levelnamePath = path.join(worldPath, 'levelname.txt');
                const iconPath = path.join(worldPath, 'world_icon.jpeg');
                try {
                    const name = await fs.readFile(levelnamePath, 'utf8');
                    let icon = null;
                    try {
                        await fs.access(iconPath);
                        icon = `file://${iconPath}`;
                    } catch {
                        // No icon, that's fine
                    }
                    return { name: name.trim(), path: worldPath, icon: icon };
                } catch (e) {
                    log.warn(`Could not read levelname.txt for ${worldPath}, skipping.`);
                    return null;
                }
            });

        const worlds = (await Promise.all(worldDetailsPromises)).filter(Boolean);
        log.info(`Found ${worlds.length} worlds.`);
        win.webContents.send('world-list-update', worlds);
    } catch (error) {
        log.error('Failed to scan for worlds:', error);
        // Optionally send an error to the renderer
    }
}

async function handleGetWorldDetails(event, worldPath) {
    const win = BrowserWindow.fromWebContents(event.sender);
    try {
        log.info(`Getting details for world: ${worldPath}`);
        // 1. Get world stats
        const stats = await fs.stat(worldPath);
        const levelname = await fs.readFile(path.join(worldPath, 'levelname.txt'), 'utf8');

        // Simple folder size calculation
        let totalSize = 0;
        const files = await fs.readdir(worldPath, { withFileTypes: true, recursive: true });
        for (const file of files) {
            try {
                const filePath = path.join(file.path, file.name);
                const fileStats = await fs.stat(filePath);
                if (fileStats.isFile()) {
                    totalSize += fileStats.size;
                }
            } catch (e) {
                log.warn(`Could not stat file ${file.name} in world folder: ${e.message}`);
            }
        }
        
        const details = {
            name: levelname.trim(),
            lastModified: stats.mtime,
            sizeInMB: (totalSize / (1024 * 1024)).toFixed(2),
            behaviorPacks: [],
            resourcePacks: []
        };

        // 2. Get all available addons to cross-reference
        const allAddons = await getAllAddons();

        // 3. Process world behavior packs
        details.behaviorPacks = await processWorldPacks(worldPath, 'world_behavior_packs.json', allAddons);

        // 4. Process world resource packs
        details.resourcePacks = await processWorldPacks(worldPath, 'world_resource_packs.json', allAddons);

        log.info(`Sending details for world ${details.name}`);
        win.webContents.send('world-details-update', details);

    } catch (error) {
        log.error(`Failed to get details for world ${worldPath}:`, error);
        // Optionally send an error to the renderer
    }
}

async function processWorldPacks(worldPath, fileName, allAddons) {
    const worldPacksPath = path.join(worldPath, fileName);
    const worldPacks = [];
    try {
        const worldPacksData = await fs.readFile(worldPacksPath, 'utf8');
        const worldPacksJson = JSON.parse(worldPacksData);

        for (const pack of worldPacksJson) {
            const foundAddon = allAddons.find(addon => addon.uuid === pack.pack_id);
            if (foundAddon) {
                worldPacks.push({ ...foundAddon, missing: false });
            } else {
                worldPacks.push({
                    name: 'Missing Pack',
                    description: `UUID: ${pack.pack_id}`,
                    uuid: pack.pack_id,
                    version: pack.version.join('.'),
                    missing: true,
                    icon: null
                });
            }
        }
    } catch (e) {
        if (e.code !== 'ENOENT') {
            log.warn(`Could not read ${fileName} for ${worldPath}: ${e.message}`);
        }
    }
    return worldPacks;
}

// Helper to get all addons from all sources
async function getAllAddons() {
    const sources = [
        // UWP Paths
        path.join(path.dirname(path.dirname(minecraftPath)), 'premium_cache', 'behavior_packs'),
        path.join(path.dirname(path.dirname(minecraftPath)), 'premium_cache', 'resource_packs'),
        path.join(minecraftPath, 'development_behavior_packs'),
        path.join(minecraftPath, 'development_resource_packs'),
        // BDS Paths
        path.join(bdsPath, 'behavior_packs'),
        path.join(bdsPath, 'resource_packs'),
        path.join(bdsPath, 'development_behavior_packs'),
        path.join(bdsPath, 'development_resource_packs')
    ];

    const allAddonFolders = [];
    for (const source of sources) {
        try {
            const entries = await fs.readdir(source, { withFileTypes: true });
            const addonFolders = entries
                .filter(dirent => dirent.isDirectory())
                .map(dirent => path.join(source, dirent.name));
            allAddonFolders.push(...addonFolders);
        } catch (e) {
            if (e.code !== 'ENOENT') {
                log.warn(`Directory not found during all-addon scan: ${source}`);
            }
        }
    }

    const addonDetailsPromises = allAddonFolders.map(async folder => {
        const details = await getAddonDetails(folder);
        if (details) {
            // We need the UUID for matching, let's add it.
            try {
                const manifestData = await fs.readFile(path.join(folder, 'manifest.json'), 'utf8');
                const manifest = JSON.parse(manifestData);
                details.uuid = manifest.header.uuid;
                details.version = manifest.header.version.join('.');
            } catch (e) {
                return null;
            }
        }
        return details;
    });

    return (await Promise.all(addonDetailsPromises)).filter(Boolean);
}


function createWindow () {
  // Register IPC handlers
  ipcMain.handle('scan-addons', handleScanAddons);
  ipcMain.handle('scan-worlds', handleScanWorlds);
  ipcMain.handle('get-world-details', handleGetWorldDetails);
  
  // Handle logs from renderer process
  ipcMain.on('log', (event, level, message) => {
    log[level](message);
  });

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

  mainWindow.webContents.on('did-finish-load', () => {
    log.info('Main window finished loading. Sending main-process-ready signal.');
    mainWindow.webContents.send('main-process-ready');
  });

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
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
