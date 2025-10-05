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
    icon.onerror = () => { icon.src = 'placeholder.png'; }; // Fallback for broken images

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
