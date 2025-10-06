const { _electron: electron } = require('playwright');
const { test, expect } = require('@playwright/test');
const { findLatestBuild, parseElectronApp } = require('electron-playwright-helpers');

let electronApp;

test.beforeAll(async () => {
  // find the latest build in the out directory
  const latestBuild = findLatestBuild('dist');
  // parse the electron app package.json file
  const appInfo = parseElectronApp(latestBuild);
  // launch the electron app
  electronApp = await electron.launch({
    args: [appInfo.main],
    executablePath: appInfo.executable,
  });
});

test.afterAll(async () => {
  // close the electron app
  await electronApp.close();
});

test('Application launches successfully', async () => {
  const window = await electronApp.firstWindow();
  await window.waitForSelector('h1');
  const title = await window.textContent('h1');
  expect(title).toBe('Bedrock Addon Manager');
});

test('World list populates on startup', async () => {
    const window = await electronApp.firstWindow();
    await window.waitForSelector('.world-item');
    const worldItems = await window.$$('.world-item');
    expect(worldItems.length).toBeGreaterThan(0);
});

test('Clicking a world item displays its details', async () => {
    const window = await electronApp.firstWindow();
    await window.waitForSelector('.world-item');
    
    // Get the name of the first world
    const firstWorldName = await window.textContent('.world-item:first-child h4');

    // Click the first world item
    await window.click('.world-item:first-child');

    // Wait for the details to appear
    await window.waitForSelector('#world-info p');

    // Check if the displayed world name matches
    const displayedName = await window.textContent('#world-info p:first-child');
    expect(displayedName).toContain(firstWorldName);

    // Check if behavior and resource pack sections are visible
    const behaviorPacksTitle = await window.textContent('h3:nth-of-type(1)');
    const resourcePacksTitle = await window.textContent('h3:nth-of-type(2)');
    expect(behaviorPacksTitle).toBe('Behavior Packs');
    expect(resourcePacksTitle).toBe('Resource Packs');
});

test('Clicking addon scan buttons populates addon list', async () => {
    const window = await electronApp.firstWindow();
    
    // Click the "Scan Marketplace" button
    await window.click('#scan-marketplace');

    // Wait for the addon list to be populated
    await window.waitForSelector('#addon-list .addon-item');

    const addonItems = await window.$$('#addon-list .addon-item');
    expect(addonItems.length).toBeGreaterThan(0);

    // Check that the addon details view is visible
    const addonDetailsContainer = await window.$('#addon-details-container');
    expect(await addonDetailsContainer.isVisible()).toBe(true);

    // Check that the world details view is hidden
    const worldDetailsContainer = await window.$('#world-details-container');
    expect(await worldDetailsContainer.isHidden()).toBe(true);
});
