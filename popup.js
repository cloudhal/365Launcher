/*
 * Copyright © 2026 Cloudrun Ltd
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Get the version from the manifest file and display it. Note that extension needs to be reloaded if you change the manifest.
const manifest = chrome.runtime.getManifest();
console.log("Manifest version:", manifest.version);
document.getElementById("version").innerText = `Version: ${manifest.version}`;
fetch(chrome.runtime.getURL("changelog.json"))
  .then(response => response.json())
  .then(data => {
    document.getElementById("release-date").innerText = `Released on: ${data.release_date}`;
    
    const changesList = document.getElementById("changes-list");
    data.changes.forEach(change => {
      const listItem = document.createElement("li");
            // Add icon based on the type of change
            if (change.includes("Added")) {
              listItem.innerHTML = "✨ " + change; // Sparkle for new features
            } else if (change.includes("Fixed")) {
              listItem.innerHTML = "🔧 " + change; // Wrench for bug fixes
            } else if (change.includes("Improved") || change.includes("Optimized")) {
              listItem.innerHTML = "🚀 " + change; // Rocket for enhancements
            } else if (change.includes("Updated")) {
              listItem.innerHTML = "🔄 " + change; // Counterclockwise arrows for updates
            } else {
              listItem.innerText = change;
            }
      changesList.appendChild(listItem);
    });
  });
// Debug mode
let debugMode;
let showAddTile = true;
let activeSearchText = '';

function setResolvedTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

function applyTheme(theme) {
  localStorage.setItem('theme', theme); // Read by theme-init.js before first paint
  let resolvedTheme = theme;

  if (theme === 'system') {
    resolvedTheme =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
  }

  setResolvedTheme(resolvedTheme);
  console.log(`🌗 Applied theme: ${resolvedTheme}`);
}

function setupKeyboardShortcuts() {
  const searchInput = document.getElementById('icon-search');

  function getVisibleIcons() {
    // Return only icons in the currently visible page
    const appsPage = document.getElementById('apps-page');
    const adminPage = document.getElementById('admin-page');
    const activePage = adminPage.classList.contains('hidden') ? appsPage : adminPage;
    return [...activePage.querySelectorAll('.app-icon')];
  }

  function isModalOpen() {
    return document.querySelector('.modal-shell[data-open="true"]') !== null;
  }

  function isTypingTarget(element) {
    const tag = element.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || element.isContentEditable;
  }

  document.addEventListener('keydown', event => {
    if (isModalOpen()) {
      return;
    }

    const { key, ctrlKey, metaKey, shiftKey } = event;

    // `/` or `Ctrl+K` / `Cmd+K` — focus search
    if ((key === '/' || ((ctrlKey || metaKey) && key === 'k')) && !isTypingTarget(document.activeElement)) {
      event.preventDefault();
      searchInput.focus();
      searchInput.select();
      return;
    }

    // `Escape` in search — clear and re-render
    if (key === 'Escape' && document.activeElement === searchInput) {
      event.preventDefault();
      searchInput.value = '';
      activeSearchText = '';
      renderFilteredPages();
      searchInput.focus();
      return;
    }

    // Arrow keys — navigate tiles (also move focus out of search if needed)
    if (key === 'ArrowRight' || key === 'ArrowLeft' || key === 'ArrowDown' || key === 'ArrowUp') {
      const icons = getVisibleIcons();
      if (icons.length === 0) return;

      const currentIndex = icons.indexOf(document.activeElement);

      // If focus is not on a tile yet, move to first tile on any arrow key
      if (currentIndex === -1) {
        event.preventDefault();
        icons[0].focus();
        return;
      }

      const cols = 6;
      let nextIndex = currentIndex;

      if (key === 'ArrowRight') nextIndex = currentIndex + 1;
      else if (key === 'ArrowLeft') nextIndex = currentIndex - 1;
      else if (key === 'ArrowDown') nextIndex = currentIndex + cols;
      else if (key === 'ArrowUp') nextIndex = currentIndex - cols;

      if (nextIndex >= 0 && nextIndex < icons.length) {
        event.preventDefault();
        icons[nextIndex].focus();
      }
      return;
    }

    // `Enter` — open first visible icon (only when focus is on search or no interactive element)
    if (key === 'Enter' && document.activeElement === searchInput) {
      const icons = getVisibleIcons();
      if (icons.length > 0) {
        event.preventDefault();
        icons[0].click();
      }
      return;
    }
  });
}

// Setup status bar to show URLs on hover
function setupStatusBar() {
  const statusBar = document.getElementById('status-bar');

  document.body.addEventListener('mouseover', event => {
    const link = event.target.closest('a[href]');
    if (link && link.href && !link.href.startsWith('#')) {
      statusBar.textContent = link.href;
    }
  });

  document.body.addEventListener('mouseout', event => {
    const link = event.target.closest('a[href]');
    if (link && link.href && !link.href.startsWith('#')) {
      statusBar.textContent = '';
    }
  });
}

// Function to log events based on debug mode setting, uses message as key name if not set
function logEvent(keyOrMessage, message) {
  if (debugMode) {
    if (message === undefined) {
      // If only one argument is provided, treat it as the message
      console.log(keyOrMessage);
      chrome.storage.local.set({ message: keyOrMessage }); // Default key name "message"
    } else {
      // If two arguments are provided, use the key
      console.log(message);
      chrome.storage.local.set({ [keyOrMessage]: message });
    }
  }
}

// Main DOM Content Load, there can be only one!
document.addEventListener('DOMContentLoaded', () => {
  togglePages(); // Toggle between apps and admin pages
  setupSearchFilter();
  renderFilteredPages(); // Built-in tiles paint immediately
  focusSearchInput();
  showAboutModal();
  showSettingsModal();
  setupKeyboardShortcuts();
  setupStatusBar();

  // Custom tiles live in chrome.storage.sync, so repaint when they arrive (and whenever they change).
  CustomTiles.loadCustomTiles()
    .then(renderFilteredPages)
    .catch(error => console.error('Loading custom tiles failed', error));
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && Object.keys(changes).some(CustomTiles.isConfigKey)) {
    if (changes.showAddTile) {
      showAddTile = changes.showAddTile.newValue !== false;
    }

    CustomTiles.loadCustomTiles()
      .then(renderFilteredPages)
      .catch(error => console.error('Refreshing custom tiles failed', error));
  }
});

function getFilteredIcons(iconSet, searchText = '') {
    const query = searchText.trim().toLowerCase();
    // Custom tiles carry an order (see CustomTiles.compareTiles) so they come first, in the user's
    // arrangement; built-ins have no order and stay alphabetical.
    const sortedIcons = [...iconSet].sort(CustomTiles.compareTiles);

    if (!query) {
      return sortedIcons;
    }

    return sortedIcons.filter(icon => icon.text.toLowerCase().includes(query));
}

function renderFilteredPages() {
  showAppsPage(activeSearchText); // Show apps page
  showAdminPage(activeSearchText); // Show admin page
  announceSearchResults();
  initializeTabMode(); // Initialize tab mode for newly rendered icons
}

// Custom tiles come first so a user's own tile wins over a built-in with the same link. Built-ins the
// user hid in the options page are left out of rendering, search and keyboard navigation alike.
function getAllIcons(page) {
  const builtins = (page === 'admin' ? adminIcons : appIcons)
    .filter(icon => !CustomTiles.isBuiltinHidden(page, icon.link));

  return [...CustomTiles.getCustomTiles(page), ...builtins];
}

function announceSearchResults() {
  const statusElement = document.getElementById('search-status');
  if (!statusElement) {
    return;
  }

  const appsCount = getFilteredIcons(getAllIcons('apps'), activeSearchText).length;
  const adminCount = getFilteredIcons(getAllIcons('admin'), activeSearchText).length;
  statusElement.textContent = `${appsCount} apps and ${adminCount} admin apps found`;
}

function setupSearchFilter() {
  const searchInput = document.getElementById('icon-search');

  searchInput.addEventListener('input', event => {
    activeSearchText = event.target.value;
    renderFilteredPages();
  });
}

function focusSearchInput() {
  const searchInput = document.getElementById('icon-search');
  requestAnimationFrame(() => {
    searchInput.focus();
    searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
  });
}

function renderEmptyState(container, label) {
  const emptyState = document.createElement('div');
  emptyState.className = 'col-span-full rounded-xl border border-slate-200/70 bg-white/60 px-3 py-6 text-center text-xs font-medium text-slate-500 dark:border-slate-700/60 dark:bg-slate-800/40 dark:text-slate-300';
  emptyState.textContent = `No ${label} found`;
  container.appendChild(emptyState);
}

function showAppsPage(searchText = '') { // Show apps HTML
    const appsPage = document.getElementById('apps-page');
    const fragment = document.createDocumentFragment();
    const filteredIcons = getFilteredIcons(getAllIcons('apps'), searchText);

    appsPage.innerHTML = '';

    filteredIcons.forEach(icon => fragment.appendChild(CustomTiles.buildTileElement(icon)));

    if (filteredIcons.length === 0) {
      renderEmptyState(appsPage, 'apps');
    }

    // Keep the add tile reachable even when every tile is hidden or filtered out.
    if (showAddTile && !searchText.trim()) {
      fragment.appendChild(buildAddTileButton('apps'));
    }

    appsPage.appendChild(fragment); // Append all icons at once for better performance
}

  function showAdminPage(searchText = '') { // Show admin HTML
    const adminPage = document.getElementById('admin-page');
    const fragment = document.createDocumentFragment();
    const filteredIcons = getFilteredIcons(getAllIcons('admin'), searchText);

    adminPage.innerHTML = '';

    filteredIcons.forEach(icon => fragment.appendChild(CustomTiles.buildTileElement(icon)));

    if (filteredIcons.length === 0) {
      renderEmptyState(adminPage, 'admin apps');
    }

    // Keep the add tile reachable even when every tile is hidden or filtered out.
    if (showAddTile && !searchText.trim()) {
      fragment.appendChild(buildAddTileButton('admin'));
    }

    adminPage.appendChild(fragment); // Append all icons at once for better performance
}

const APPS_ICON_PATH = 'M4.5 4.5h6v6h-6zm9 0h6v6h-6zm-9 9h6v6h-6zm9 0h6v6h-6z';
const ADMIN_ICON_PATH = 'M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z';

// Shows either the Apps or the Admin grid and keeps the switch button in sync.
function setAdminView(isAdmin) {
  document.getElementById('switch-btn').setAttribute('aria-pressed', String(isAdmin));
  document.getElementById('apps-page').classList.toggle('hidden', isAdmin);
  document.getElementById('admin-page').classList.toggle('hidden', !isAdmin);
  document.getElementById('switch-label').textContent = isAdmin ? 'Admin' : 'Apps';
  document.getElementById('switch-icon-path').setAttribute('d', isAdmin ? ADMIN_ICON_PATH : APPS_ICON_PATH);
}

function togglePages() { // Toggle button to switch between Apps and Admin pages
    const switchButton = document.getElementById('switch-btn');
    const refreshButton = document.getElementById('refresh-btn');
    const setPressedState = (button, isPressed) => {
      button.setAttribute('aria-pressed', String(isPressed));
    };

  // Load the switch state from chrome.storage
  chrome.storage.sync.get(["switchState", "debugMode", "refreshState"], (data) => {
    setPressedState(refreshButton, data.refreshState || false);
    debugMode = data.debugMode || false;
    setAdminView(data.switchState || false);
  });

    // Save switch state when toggled
    switchButton.addEventListener('click', () => {
      const isAdmin = switchButton.getAttribute('aria-pressed') !== 'true';
      chrome.storage.sync.set({ switchState: isAdmin }, () => {
        logEvent(`Admin switch state: ${isAdmin}`);
      });
      setAdminView(isAdmin);
    });

    // Save refresh switch state when toggled
    refreshButton.addEventListener('click', () => {
      const isRefresh = refreshButton.getAttribute('aria-pressed') !== 'true';
      setPressedState(refreshButton, isRefresh);
      chrome.storage.sync.set({ refreshState: isRefresh }, () => {
        logEvent(`Refresh switch state: ${isRefresh}`);
      });
    });
}

function isRefreshEnabled() {
  return document.getElementById('refresh-btn').getAttribute('aria-pressed') === 'true';
}

// Tab mode is cached so re-rendering tiles (e.g. on every search keystroke) does not re-read
// chrome.storage.sync. Clicks are delegated from the page containers, so handlers survive
// re-renders without ever being attached twice.
let activeTabMode = 'individual';
let tabModeListenerBound = false;

function initializeTabMode() { // Initialize tab mode
  if (tabModeListenerBound) {
    return;
  }
  tabModeListenerBound = true;

  ['apps-page', 'admin-page'].forEach(pageId => {
    document.getElementById(pageId).addEventListener('click', handleIconClick);
  });

  // Load the tab mode from chrome.storage
  chrome.storage.sync.get({ tabMode: "individual" }, (data) => {
    activeTabMode = data.tabMode;
  });
}

function buildAddTileButton(page) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'app-icon add-tile';
  button.dataset.addTile = page;
  button.setAttribute('aria-label', 'Add a custom tile');
  button.innerHTML = `
    <div class="icon-item items-center justify-center border border-dashed border-slate-300 text-slate-400 dark:border-slate-600 dark:text-slate-500">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor" class="h-6 w-6" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14" />
      </svg>
      <p class="mt-1 text-[11px] font-medium">Add</p>
    </div>`;
  return button;
}

function handleIconClick(event) {
  const addTileButton = event.target.closest('[data-add-tile]');

  if (addTileButton) {
    CustomTiles.openTileForm({
      page: addTileButton.dataset.addTile,
      onSaved: renderFilteredPages
    });
    return;
  }

  const icon = event.target.closest('.app-icon');
  if (!icon) {
    return;
  }

  event.preventDefault(); // Prevent default behavior
  const href = icon.href;

  // New tab mode: open all links in a new tab
  if (activeTabMode === 'new') {
    chrome.tabs.create({ url: href });
    return;
  }

  logEvent("ClickedURL", href); // Save the clicked URL in chrome.storage for debugging
  chrome.storage.local.remove("alternativeURL");

  // Single tab mode: open all links in the same single tab every time
  if (activeTabMode === 'single') {
    openOrUpdateSingleTab(href);
    return;
  }

  // Individual tab mode: focus a matching tab if one is open, otherwise open the link
  const allIcons = [...CustomTiles.getCustomTiles(), ...appIcons, ...adminIcons];
  const tileId = icon.dataset.tileId;
  const item = tileId
    ? allIcons.find(candidate => candidate.id === tileId)
    : allIcons.find(candidate => candidate.link === href);

  if (!item) {
    logEvent(`No matching icon item for ${href}`);
    return;
  }

  chrome.tabs.query({}, (tabs) => {
    openOrFocusTab(item.link, tabs, item);
  });
}

// function to open or focus in a single tab every time (single tab mode)
function openOrUpdateSingleTab(url) {
  chrome.storage.local.get("myTabId", (data) => {
    const storedTabId = data.myTabId;
    // If we have a stored tabId, check if it's still open
    if (storedTabId) {
      chrome.tabs.get(storedTabId, (tab) => {
        if (chrome.runtime.lastError || !tab) {
          // Tab doesn't exist (closed), create a new one
          createNewTab(url);
        } else {
          // Tab exists, update it. We could check if it matches the URL in which case we don't need to update it.
          chrome.tabs.update(storedTabId, { url: url }, () => {
            logEvent(`Updated existing tab: ${storedTabId}`);
          });
          // focus the tab
          chrome.tabs.update(storedTabId, { active: true }, () => {
            logEvent(`Focused existing tab: ${storedTabId}`);
          });
          // Save the tabId again in case it changes (e.g., if the user closes and reopens the tab)
          chrome.storage.local.set({ myTabId: storedTabId }, () => {
            logEvent(`Stored tab ID: ${storedTabId}`);
          });
          // Save the URL for debugging
          chrome.storage.local.remove("alternativeURL");
          logEvent("Found matching tab using exact match");
          logEvent("url", url );
        }
      });
    } else {
      // No stored tabId, create a new tab
      createNewTab(url);
    }
  });
}

// Helper function for openOrUpdateSingleTab to create a new tab and store its ID
function createNewTab(url) {
  chrome.tabs.create({ url: url }, (tab) => {
    chrome.storage.local.set({ myTabId: tab.id });
    logEvent(`Created new tab with ID: ${tab.id}`);
    chrome.tabs.update(tab.id, { active: true }, () => {
      logEvent(`Focused new tab: ${tab.id}`);
    });
  });
}

// Function to open or focus an existing tab using the link and match type
function openOrFocusTab(url, tabs, item) {
  if (item.matchType === 'exact') {
    // Check if the URL matches exactly
    const existingTab = tabs.find(tab => tab.url === url);
    if (existingTab) {
      logEvent(`Found matching tab using exact match`);
      chrome.tabs.update(existingTab.id, { active: true });
      // if isRefresh is true, refresh the tab
        if (isRefreshEnabled()) {
          chrome.tabs.reload(existingTab.id, () => {
              logEvent(`Refreshed tab for link: ${item.link}`);
          });
          logEvent(`Refreshed tab for link: ${item.link}`);
      }
    } else {
      chrome.tabs.create({ url: url });
    }
  }
  else if (item.matchType === 'startsWith') {
    // Check if the URL starts with the specified link
    const existingTab = tabs.find(tab => tab.url.startsWith(item.link));
    if (existingTab) {
      logEvent(`Found matching tab using startsWith`);
      chrome.tabs.update(existingTab.id, { active: true });
            // if isRefresh is true, refresh the tab
        if (isRefreshEnabled()) {
          chrome.tabs.reload(existingTab.id, () => {
              logEvent(`Refreshed tab for link: ${item.link}`);
          });
          logEvent(`Refreshed tab for link: ${item.link}`);
      }
    } else {
      chrome.tabs.create({ url: item.link });
    }
  } else if (item.matchType === 'pattern') {
    // Check if the URL matches the pattern
    const existingTab = tabs.find(tab => matchPattern(item.link, tab.url, item.alternativeLinks));
    if (existingTab) {
      logEvent(`Found matching tab using pattern match`);
      chrome.tabs.update(existingTab.id, { active: true });
            // if isRefresh is true, refresh the tab
        if (isRefreshEnabled()) {
          chrome.tabs.reload(existingTab.id, () => {
              logEvent(`Refreshed tab for link: ${item.link}`);
          });
          logEvent(`Refreshed tab for link: ${item.link}`);
      }
    } else {
      logEvent(`Didn't find matching tab"`);
      chrome.tabs.create({ url: item.link });
    }
  }
}

// Function to match wildcard patterns
function matchPattern(pattern, url, alternativeLinks = []) {
  // Check primary pattern match
  if (CustomTiles.wildcardToRegExp(pattern).test(url)) return true;

  // Check alternative links
  const matchingAlternative = alternativeLinks.find(alternative => CustomTiles.wildcardToRegExp(alternative).test(url));

  if (matchingAlternative) {
    chrome.storage.local.set({ alternativeURL: matchingAlternative }); // Save alternative link for debugging
    return true;
  }

  return false;
}


  // About modal
function showAboutModal() {
  const aboutIcon = document.getElementById('about-icon');
  const aboutModal = UI.createModalController('about-modal');
  const logoDark = document.getElementById('logo-dark');
  const logoLight = document.getElementById('logo-light');

  const updateLogos = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';

    if (currentTheme === 'dark') {
      logoDark.classList.add('hidden');
      logoLight.classList.remove('hidden');
    } else {
      logoDark.classList.remove('hidden');
      logoLight.classList.add('hidden');
    }
  };

  aboutIcon.addEventListener('click', () => {
    updateLogos();
    aboutModal.openModal(aboutIcon);
  });
}


// Share button actions
// Share the public product page: window.location is the chrome-extension:// popup URL.
const SHARE_URL = "https://cloudrun.co.uk/software/365launcher/";

document.querySelectorAll('.share-btn').forEach(btn => {
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    const platform = this.getAttribute('data-platform');
    const url = encodeURIComponent(SHARE_URL);
    const text = encodeURIComponent("Check out 365 Launcher - a great productivity tool!");
    
    let shareUrl;
    switch(platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${text}`;
        break;
      case 'reddit':
        shareUrl = `https://www.reddit.com/submit?url=${url}&title=${text}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
    }

    if (!shareUrl) {
      return;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
  });
});

// Settings modal
function showSettingsModal() {
    const settingsIcon = document.getElementById('settings-icon');
    const settingsModal = UI.createModalController('settings-modal');
    const themeSelect = document.getElementById('theme');
    const tabModeSelect = document.getElementById('tab-mode');
    const debugModeToggle = document.getElementById('debug-mode');
    const showAddTileToggle = document.getElementById('show-add-tile');
    const manageTilesButton = document.getElementById('manage-tiles');
    const customTileCount = document.getElementById('custom-tile-count');
    const resetButton = document.getElementById('reset-settings');
    const resetConfirm = document.getElementById('reset-confirm');
    const resetCancel = document.getElementById('reset-cancel');
    const resetConfirmButton = document.getElementById('reset-confirm-button');
    const resetStatus = document.getElementById('reset-status');
    const refreshButton = document.getElementById('refresh-btn');

    const DEFAULT_SETTINGS = {
      theme: 'system',
      debugMode: false,
      tabMode: 'individual',
      showAddTile: true
    };

    // Applies the saved visibility to the grids, re-rendering only when it actually changes.
    const syncAddTileVisibility = value => {
      const next = value !== false;

      if (next === showAddTile) return;

      showAddTile = next;
      renderFilteredPages();
    };

    const loadSettings = () => {
      chrome.storage.sync.get(DEFAULT_SETTINGS, data => {
        applyControls(data);
        applyTheme(data.theme);
        syncAddTileVisibility(data.showAddTile);
      });
    };

    const applyControls = settings => {
      themeSelect.value = settings.theme;
      tabModeSelect.value = settings.tabMode;
      debugModeToggle.checked = settings.debugMode;
      showAddTileToggle.checked = settings.showAddTile;
    };

    const showResetConfirmation = isConfirming => {
      resetButton.classList.toggle('hidden', isConfirming);
      resetConfirm.classList.toggle('hidden', !isConfirming);
      resetStatus.classList.add('hidden');
    };

    resetButton.addEventListener('click', () => {
      showResetConfirmation(true);
      resetConfirmButton.focus();
    });

    resetCancel.addEventListener('click', () => {
      showResetConfirmation(false);
      resetButton.focus();
    });

    resetConfirmButton.addEventListener('click', async () => {
      resetConfirmButton.disabled = true;

      try {
        await CustomTiles.resetAll();
      } catch (error) {
        console.error('Resetting 365 Launcher failed', error);
        resetStatus.textContent = 'Reset failed. Try reloading the extension.';
        resetStatus.classList.remove('hidden');
        return;
      } finally {
        resetConfirmButton.disabled = false;
      }

      // Mirror the cleared storage in the current session
      debugMode = DEFAULT_SETTINGS.debugMode;
      showAddTile = DEFAULT_SETTINGS.showAddTile;
      activeTabMode = DEFAULT_SETTINGS.tabMode;
      applyControls(DEFAULT_SETTINGS);
      applyTheme(DEFAULT_SETTINGS.theme);
      setAdminView(false);
      refreshButton.setAttribute('aria-pressed', 'false');
      updateCustomTileCount();
      renderFilteredPages();

      showResetConfirmation(false);
      resetStatus.textContent = 'Everything has been reset.';
      resetStatus.classList.remove('hidden');
    });

    const updateCustomTileCount = () => {
      const custom = CustomTiles.getCustomTiles().length;
      const hidden = CustomTiles.getHiddenBuiltins().length;
      const parts = [custom === 1 ? '1 custom' : `${custom} custom`];

      if (hidden > 0) {
        parts.push(`${hidden} hidden`);
      }

      customTileCount.textContent = parts.join(' · ');
    };

    manageTilesButton.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
      settingsModal.closeModal();
    });

    settingsIcon.addEventListener('click', () => {
      loadSettings();
      updateCustomTileCount();
      settingsModal.openModal(settingsIcon);
    });

    // Every control applies and persists as soon as it changes; there is no Save step.
    const persistSetting = (values, label) => {
      chrome.storage.sync.set(values, () => {
        if (chrome.runtime.lastError) {
          console.error(`Storing ${label} failed`, chrome.runtime.lastError);
          return;
        }

        logEvent(`${label}: ${Object.values(values).join(', ')}`);
      });
    };

    tabModeSelect.addEventListener('change', () => {
      activeTabMode = tabModeSelect.value; // Applied to the next tile click
      persistSetting({ tabMode: activeTabMode }, 'Tab mode');
    });

    themeSelect.addEventListener('change', () => {
      applyTheme(themeSelect.value);
      persistSetting({ theme: themeSelect.value }, 'Theme');
    });

    debugModeToggle.addEventListener('change', () => {
      debugMode = debugModeToggle.checked;
      console.log(debugMode ? "🛠 Debug mode enabled! Logging events..." : "🛠 Debug mode disabled");
      persistSetting({ debugMode }, 'Debug mode');
    });

    showAddTileToggle.addEventListener('change', () => {
      showAddTile = showAddTileToggle.checked;
      renderFilteredPages();
      persistSetting({ showAddTile }, 'Add tile visibility');
    });

    loadSettings();
};

