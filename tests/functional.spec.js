const { _electron: electron } = require('playwright');
const { test, expect } = require('@playwright/test');

test('Application launches successfully', async () => {
  const electronApp = await electron.launch({ args: ['.'] });
  const window = await electronApp.firstWindow();
  await window.waitForSelector('h1');
  const title = await window.textContent('h1');
  expect(title).toBe('Bedrock Addon Manager');
  await electronApp.close();
});

test('World list populates on startup', async () => {
    const electronApp = await electron.launch({ args: ['.'] });
    const window = await electronApp.firstWindow();
    await window.waitForSelector('.world-item');
    const worldItems = await window.$$('.world-item');
    expect(worldItems.length).toBeGreaterThan(0);
    await electronApp.close();
});

test('Clicking a world item displays its details', async () => {
    const electronApp = await electron.launch({ args: ['.'] });
    const window = await electronApp.firstWindow();
    await window.waitForSelector('.world-item:first-child');
    
    // Get the name of the first world from its span
    const firstWorldName = await window.textContent('.world-item:first-child span');

    // Click the first world item
    await window.click('.world-item:first-child');

    // Wait for the details to appear and check if the name in the h4 matches
    await window.waitForSelector('#world-info h4');
    const detailName = await window.textContent('#world-info h4');
    expect(detailName).toBe(firstWorldName);

    // Also check for behavior and resource pack sections
    await window.waitForSelector('#world-behavior-packs');
    await window.waitForSelector('#world-resource-packs');
    await electronApp.close();
});

test('Clicking addon scan buttons populates addon list', async () => {
    const electronApp = await electron.launch({ args: ['.'] });
    const window = await electronApp.firstWindow();
    
    // Click the "Scan Marketplace" button
    await window.click('#scan-premium-btn');

    // Wait for the addon list to be populated
    await window.waitForSelector('#addon-list .addon-item');

    const addonItems = await window.$$('#addon-list .addon-item');
    expect(addonItems.length).toBeGreaterThan(0);
    await electronApp.close();
});
