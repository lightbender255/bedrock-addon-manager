window.electronAPI.onMainProcessReady(() => {
    window.electronAPI.log('info', 'Main process is ready. Initializing world scan.');
    // Initial scan for worlds when the app is ready
    window.electronAPI.scanWorlds();
});

window.electronAPI.log('info', 'Renderer process loaded.');

const premiumBtn = document.getElementById('scan-premium-btn');
const behaviorBtn = document.getElementById('scan-behavior-btn');
const resourceBtn = document.getElementById('scan-resource-btn');
const addonListDiv = document.getElementById('addon-list');

premiumBtn.addEventListener('click', () => scan('premium_cache'));
behaviorBtn.addEventListener('click', () => scan('development_behavior_packs'));
resourceBtn.addEventListener('click', () => scan('development_resource_packs'));

function scan(scanType) {
  window.electronAPI.log('info', `Scan button clicked for: ${scanType}`);
  addonListDiv.innerHTML = `<p class="placeholder">Scanning...</p>`;
  window.electronAPI.scanAddons(scanType);
}

window.electronAPI.onAddonListUpdate((_event, addons) => {
  addonListDiv.innerHTML = '';
  if (addons.length === 0) {
    addonListDiv.innerHTML = `<p class="placeholder">No addons found.</p>`;
    return;
  }

  addons.forEach(addon => {
    const item = document.createElement('div');
    item.className = 'addon-item';

    const icon = document.createElement('img');
    icon.src = addon.icon || 'placeholder.png'; // Use a placeholder if no icon
    icon.className = 'addon-icon';
    icon.onerror = () => {
        icon.onerror = null;
        icon.src = 'placeholder.png';
    }; // Fallback for broken images

    const details = document.createElement('div');
    details.className = 'addon-details';

    const name = document.createElement('h3');
    name.textContent = addon.name;

    const description = document.createElement('p');
    description.textContent = addon.description;

    details.appendChild(name);
    details.appendChild(description);
    item.appendChild(icon);
    item.appendChild(details);
    addonListDiv.appendChild(item);
  });
});

const worldListDiv = document.getElementById('world-list');
const worldInfoDiv = document.getElementById('world-info');
const worldBehaviorPacksDiv = document.getElementById('world-behavior-packs');
const worldResourcePacksDiv = document.getElementById('world-resource-packs');
const refreshWorldsBtn = document.getElementById('refresh-worlds');

let selectedWorldCard = null;

refreshWorldsBtn.addEventListener('click', () => {
    window.electronAPI.log('info', 'Refresh worlds button clicked.');
    worldListDiv.innerHTML = '<p class="placeholder">Scanning for worlds...</p>';
    window.electronAPI.scanWorlds();
});

window.electronAPI.onWorldListUpdate((worlds) => {
    window.electronAPI.log('info', `Received ${worlds.length} worlds. Updating UI.`);
    worldListDiv.innerHTML = '';
    if (worlds.length === 0) {
        worldListDiv.innerHTML = '<p class="placeholder">No worlds found.</p>';
        return;
    }

    worlds.forEach(world => {
        const item = document.createElement('div');
        item.className = 'world-item';
        item.setAttribute('data-path', world.path);

        const icon = document.createElement('img');
        icon.src = world.icon || 'placeholder.png';
        icon.className = 'world-icon';
        icon.onerror = () => {
            icon.onerror = null;
            icon.src = 'placeholder.png';
        };

        const name = document.createElement('span');
        name.textContent = world.name;

        item.appendChild(icon);
        item.appendChild(name);

        item.addEventListener('click', () => {
            if (selectedWorldCard) {
                selectedWorldCard.classList.remove('selected');
            }
            item.classList.add('selected');
            selectedWorldCard = item;

            window.electronAPI.log('info', `Requesting details for world: ${world.name}`);
            worldInfoDiv.innerHTML = '<p class="placeholder">Loading world details...</p>';
            worldBehaviorPacksDiv.innerHTML = '';
            worldResourcePacksDiv.innerHTML = '';
            window.electronAPI.getWorldDetails(world.path);
        });

        worldListDiv.appendChild(item);
    });
});

window.electronAPI.onWorldDetailsUpdate((details) => {
    window.electronAPI.log('info', `Received details for world: ${details.name}`);
    // World Info
    worldInfoDiv.innerHTML = `
        <h4></h4>
        <p><strong>Last Played:</strong> ${new Date(details.lastModified).toLocaleString()}</p>
        <p><strong>Size:</strong> ${details.sizeInMB} MB</p>
    `;
    worldInfoDiv.querySelector('h4').textContent = details.name;

    // Behavior Packs
    renderPackList(worldBehaviorPacksDiv, details.behaviorPacks, 'No behavior packs applied.');

    // Resource Packs
    renderPackList(worldResourcePacksDiv, details.resourcePacks, 'No resource packs applied.');
});

function renderPackList(container, packs, emptyMessage) {
    container.innerHTML = '';
    if (packs.length === 0) {
        container.innerHTML = `<p class="placeholder">${emptyMessage}</p>`;
        return;
    }

    packs.forEach(pack => {
        const item = document.createElement('div');
        item.className = `addon-item ${pack.missing ? 'missing' : ''}`;

        const icon = document.createElement('img');
        icon.src = pack.icon || 'placeholder.png';
        icon.className = 'addon-icon';
        icon.onerror = () => {
            icon.onerror = null;
            icon.src = 'placeholder.png';
        };

        const packDetails = document.createElement('div');
        packDetails.className = 'addon-details';

        const name = document.createElement('h3');
        name.textContent = pack.name;
        if (pack.missing) {
            name.textContent += ' (Missing)';
        }

        const description = document.createElement('p');
        description.textContent = pack.description;

        packDetails.appendChild(name);
        packDetails.appendChild(description);
        item.appendChild(icon);
        item.appendChild(packDetails);
        container.appendChild(item);
    });
}
