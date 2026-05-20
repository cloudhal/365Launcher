/*
 * Copyright © 2026 Cloudrun Ltd
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

class IconItem {
    constructor(image, link, text, matchType, alternativeLinks = []) {
      if (!image || !link || !text || !matchType) {
        throw new Error("Missing required IconItem parameters");
    }
      this.image = image;
      this.link = link;
      this.text = text;
      this.matchType = matchType; // 'exact', 'startsWith', or 'pattern'
      this.alternativeLinks = alternativeLinks; // Array of alternative URLs, blank if none
    }
  }

// app icons
// To test pattern matching in a regex tester, replace * with .* and escape forward slashes with \/ e.g. https:\/\/[^.-]+.sharepoint.com\/.*
// Any time you want to match using a * wildcard, set the type to 'pattern'
// For icons, if no border is present, resize image to 44px using Photoshop or Photopea, then resize the canvas to 50 px to add some space
const appIcons = [
  new IconItem("icons/Bookings_50x50.png", "https://outlook.office.com/bookings/", "Bookings", "startsWith"),
  new IconItem("icons/Excel_50x50.png", "https://m365.cloud.microsoft/launch/excel/", "Excel", "startsWith"),
  new IconItem("icons/Copilot_50x50.png", "https://m365.cloud.microsoft/chat", "Copilot", "pattern", ["https://copilot.cloud.microsoft/*","https://m365.cloud.microsoft/chat*"]),
  new IconItem("icons/Fabric_50x50.png", "https://app.fabric.microsoft.com/", "Fabric", "startsWith"),
  new IconItem("icons/Forms_50x50.png", "https://forms.office.com/", "Forms", "startsWith"),
  new IconItem("icons/Lists_50x50.png", "https://m365.cloud.microsoft/launch/lists/", "Lists", "pattern", ["https://*-my.sharepoint.com/personal/*/Lists.aspx?*","https://*.sharepoint.com/sites/*/Lists/*"]),
  new IconItem("icons/Microsoft_Teams_50x50.png", "https://teams.microsoft.com/", "Teams", "startsWith"),
  new IconItem("icons/Microsoft365_50x50.png", "https://m365.cloud.microsoft/?auth=2", "Office", "exact"),
  new IconItem("icons/OneDrive_50x50.png", "https://m365.cloud.microsoft/launch/onedrive/", "OneDrive", "pattern", ["https://*-my.sharepoint.com/?*","https://*-my.sharepoint.com/shared?*","https://*-my.sharepoint.com/my?*"]),
  new IconItem("icons/OneNote_50x50.png", "https://m365.cloud.microsoft/launch/onenote/", "OneNote", "startsWith"),
  new IconItem("icons/Outlook_50x50.png", "https://outlook.office.com/mail", "Outlook", "startsWith"),
  new IconItem("icons/Planner_50x50.png", "https://planner.cloud.microsoft/", "Planner", "startsWith"),
  new IconItem("icons/Power_Apps_50x50.png", "https://make.powerapps.com/", "Power Apps", "startsWith"),
  new IconItem("icons/Power_Automate_50x50.png", "https://make.powerautomate.com/", "Power Automate", "startsWith", ["https://flow.microsoft.com/*"]),
  new IconItem("icons/Copilot_Studio_50x50.png", "https://copilotstudio.microsoft.com/", "Copilot Studio", "startsWith"),
  new IconItem("icons/PowerPoint_50x50.png", "https://m365.cloud.microsoft/launch/powerpoint/", "PowerPoint", "startsWith"),
  new IconItem("icons/Power_BI_50x50.png", "https://app.powerbi.com/", "Power BI", "startsWith"),
  new IconItem("icons/Power_Pages_50x50.png", "https://make.powerpages.microsoft.com/", "Power Pages", "startsWith"),
  new IconItem("icons/Project_50x50.png", "https://project.microsoft.com/", "Project", "startsWith"),
  new IconItem("icons/SharePoint_50x50.png", "https://m365.cloud.microsoft/launch/sharepoint/", "SharePoint", "pattern", ["https://[^.-]+.sharepoint.com/*"]), // don't match anything with a - in the subdomain
  new IconItem("icons/To_Do_50x50.png", "https://to-do.office.com/", "To Do", "startsWith"),
  new IconItem("icons/Microsoft-Stream_50x50.png", "https://m365.cloud.microsoft/launch/stream", "Stream", "startsWith"),
  new IconItem("icons/Word_50x50.png", "https://m365.cloud.microsoft/launch/word/", "Word", "startsWith"),
  new IconItem("icons/Engage_50x50.png", "https://engage.cloud.microsoft/", "Engage", "startsWith"),
  new IconItem("icons/Loop_50x50.png", "https://loop.cloud.microsoft/", "Loop", "startsWith"),
  new IconItem("icons/Visio_50x50.png", "https://m365.cloud.microsoft/launch/visio", "Visio", "startsWith"),
  new IconItem("icons/Viva_50x50.png", "https://viva.cloud.microsoft/", "Viva", "startsWith"),
  new IconItem("icons/Designer_50x50.png", "https://designer.microsoft.com/", "Designer", "startsWith"),
  new IconItem("icons/Clipchamp_50x50.png", "https://www.office.com/launch/clipchamp?auth=2/", "Clipchamp", "startsWith"),
  new IconItem("icons/Windows_50x50.png", "https://windows.cloud.microsoft/", "Windows app", "startsWith")
];

// admin icons
const adminIcons = [
    new IconItem("icons/Microsoft365_50x50.png", "https://admin.cloud.microsoft/#", "365 Admin", "startsWith"),
    new IconItem("icons/EntraID_50x50.png", "https://entra.microsoft.com/", "Entra", "startsWith"),
    new IconItem("icons/Azure_50x50.png", "https://portal.azure.com/", "Azure", "startsWith"),
    new IconItem("icons/Purview_50x50.png", "https://purview.microsoft.com/", "Purview", "startsWith"),
    new IconItem("icons/Intune_50x50.png", "https://intune.microsoft.com/", "Intune", "startsWith"),
    new IconItem("icons/Exchange_50x50.png", "https://admin.cloud.microsoft/exchange", "Exchange", "startsWith"),
    new IconItem("icons/PowerPlatform_50x50.png", "https://admin.powerplatform.microsoft.com/", "Power Platform", "startsWith"),
    new IconItem("icons/Fabric_50x50.png", "https://app.fabric.microsoft.com/admin-portal/tenantSettings?experience=fabric-developer/", "Fabric", "startsWith"),
    new IconItem("icons/Defender_50x50.png", "https://security.microsoft.com/", "Defender", "startsWith"),
    new IconItem("icons/Lighthouse_50x50.png", "https://lighthouse.microsoft.com/", "Lighthouse", "startsWith"),
    new IconItem("icons/SharePoint_50x50.png", "https://admin.microsoft.com/sharepoint", "SharePoint", "pattern", ["https://*-admin.sharepoint.com/*"]),
    new IconItem("icons/Microsoft_Teams_50x50.png", "https://admin.teams.microsoft.com/", "Teams", "startsWith"),
    new IconItem("icons/Engage_50x50.png", "https://engage.cloud.microsoft/main/admin", "Engage", "startsWith"),
    new IconItem("icons/AzureDevops_50x50.png", "https://dev.azure.com/", "DevOps", "startsWith"),
    new IconItem("icons/MicrosoftGraph_50x50.png", "https://developer.microsoft.com/en-us/graph/graph-explorer/", "Graph", "startsWith"),
    new IconItem("icons/Office_50x50.png", "https://config.office.com/", "365 Apps", "startsWith"),
    new IconItem("icons/Foundry_50x50.png", "https://ai.azure.com/", "Foundry", "startsWith"),
];

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
let activeSearchText = '';

function setResolvedTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

function applyTheme(theme) {
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

function createModalController(modalId) {
  const modal = document.getElementById(modalId);
  let lastFocusedElement = null;

  const getFocusableElements = () => {
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];

    return [...modal.querySelectorAll(selectors.join(','))]
      .filter(element => element.offsetParent !== null || element === document.activeElement);
  };

  const closeModal = () => {
    modal.dataset.open = 'false';
    modal.setAttribute('aria-hidden', 'true');

    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  };

  const openModal = (triggerElement = document.activeElement) => {
    lastFocusedElement = triggerElement;
    modal.dataset.open = 'true';
    modal.setAttribute('aria-hidden', 'false');

    const [firstFocusable] = getFocusableElements();
    if (firstFocusable) {
      firstFocusable.focus();
    }
  };

  modal.querySelectorAll('[data-close-modal]').forEach(button => {
    button.addEventListener('click', closeModal);
  });

  modal.addEventListener('click', event => {
    if (event.target === modal) {
      closeModal();
    }
  });

  modal.addEventListener('keydown', event => {
    if (event.key !== 'Tab' || modal.dataset.open !== 'true') {
      return;
    }

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  });

  modal.__closeModal = closeModal;

  return { openModal, closeModal };
}

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') {
    return;
  }

  const openModals = [...document.querySelectorAll('.modal-shell[data-open="true"]')];
  const activeModal = openModals[openModals.length - 1];

  if (!activeModal) {
    return;
  }

  event.preventDefault();
  if (typeof activeModal.__closeModal === 'function') {
    activeModal.__closeModal();
  }
});

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
  renderFilteredPages();
  focusSearchInput();
  showAboutModal();
  showSettingsModal();
  setupKeyboardShortcuts();
});

function getFilteredIcons(iconSet, searchText = '') {
    const query = searchText.trim().toLowerCase();
    const sortedIcons = [...iconSet].sort((a, b) => a.text.localeCompare(b.text));

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

function announceSearchResults() {
  const statusElement = document.getElementById('search-status');
  if (!statusElement) {
    return;
  }

  const appsCount = getFilteredIcons(appIcons, activeSearchText).length;
  const adminCount = getFilteredIcons(adminIcons, activeSearchText).length;
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
    const filteredIcons = getFilteredIcons(appIcons, searchText);

    appsPage.innerHTML = '';

    if (filteredIcons.length === 0) {
      renderEmptyState(appsPage, 'apps');
      return;
    }

    filteredIcons.forEach(icon => {
      const iconHTML = `
      <a href="${icon.link}" target="_blank" class="app-icon">
        <div class="icon-item">
          <img src="${icon.image}" alt="${icon.text}" class="h-auto max-w-[35px]">
          <p class="mt-2 line-clamp-2 text-[11px] font-medium text-slate-700 dark:text-slate-200">${icon.text}</p>
        </div>
      </a>`;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = iconHTML;
        fragment.appendChild(tempDiv.firstElementChild);
    });
    appsPage.appendChild(fragment); // Append all icons at once for better performance
}

  function showAdminPage(searchText = '') { // Show admin HTML
    const adminPage = document.getElementById('admin-page');
    const fragment = document.createDocumentFragment();
    const filteredIcons = getFilteredIcons(adminIcons, searchText);

    adminPage.innerHTML = '';

    if (filteredIcons.length === 0) {
      renderEmptyState(adminPage, 'admin apps');
      return;
    }

    filteredIcons.forEach(icon => {
      const iconHTML = `
      <a href="${icon.link}" target="_blank" class="app-icon">
        <div class="icon-item">
          <img src="${icon.image}" alt="${icon.text}" class="h-auto max-w-[35px]">
          <p class="mt-2 line-clamp-2 text-[11px] font-medium text-slate-700 dark:text-slate-200">${icon.text}</p>
        </div>
      </a>`;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = iconHTML;
        fragment.appendChild(tempDiv.firstElementChild);
    });
    adminPage.appendChild(fragment); // Append all icons at once for better performance
}

function togglePages() { // Toggle button to switch between Apps and Admin pages

  // Get HTML elements for the switch button and pages
    const switchButton = document.getElementById('switch-btn');
    const switchIconPath = document.getElementById('switch-icon-path');
    const switchLabel = document.getElementById('switch-label');
    const refreshButton = document.getElementById('refresh-btn');
    const appsPage = document.getElementById('apps-page');
    const adminPage = document.getElementById('admin-page');
    const appsIconPath = 'M4.5 4.5h6v6h-6zm9 0h6v6h-6zm-9 9h6v6h-6zm9 0h6v6h-6z';
    const adminIconPath = 'M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z';
    const setPressedState = (button, isPressed) => {
      button.setAttribute('aria-pressed', String(isPressed));
    };
  
  // Load the switch state from chrome.storage
  chrome.storage.sync.get(["switchState", "debugMode", "refreshState"], (data) => {
    const switchState = data.switchState || false; // Default to false if not set
    const refreshState = data.refreshState || false; // Default to false if not set
    setPressedState(switchButton, switchState);
    setPressedState(refreshButton, refreshState); // Set the refresh button state
    debugMode = data.debugMode || false;
    updatePages(switchState); // Update pages based on state
  });

    // Update pages based on the switch state
    const updatePages = (isAdmin) => {
      setPressedState(switchButton, isAdmin);
      if (isAdmin) {
        appsPage.classList.add('hidden');
        adminPage.classList.remove('hidden');
        switchLabel.textContent = 'Admin';
        switchIconPath.setAttribute('d', adminIconPath);
      } else {
        adminPage.classList.add('hidden');
        appsPage.classList.remove('hidden');
        switchLabel.textContent = 'Apps';
        switchIconPath.setAttribute('d', appsIconPath);
      }
    };
  
    // Save switch state when toggled
    switchButton.addEventListener('click', () => {
      const isAdmin = switchButton.getAttribute('aria-pressed') !== 'true';
      chrome.storage.sync.set({ switchState: isAdmin }, () => {
        logEvent(`Admin switch state: ${isAdmin}`);
      });
      updatePages(isAdmin);
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

function initializeTabMode() { // Initialize tab mode
  const icons = document.querySelectorAll('.app-icon');
  const iconItems = [...appIcons, ...adminIcons]; // Combine app and admin icons

  // Load the tab mode from chrome.storage
  chrome.storage.sync.get(["tabMode"], (data) => {
    const tabMode = data.tabMode || "individual"; // Default to "individual" if not set

if (tabMode === "individual") {
    // Individual tab mode: open each link in a new tab
    icons.forEach(icon => {
      icon.addEventListener('click', (event) => {
          event.preventDefault(); // Prevent default behavior
          logEvent("ClickedURL", icon.href );  // Save the clicked URL in chrome.storage for debugging
          chrome.storage.local.remove("alternativeURL");
          chrome.tabs.query({}, (tabs) => {
              // Check if the clicked link matches any icon item
              iconItems.forEach(item => {
                  if (item.link === icon.href) { // found matching icon item
                        openOrFocusTab(item.link, tabs, item); // Open or focus the tab
                        return; // Stop further iterations once a match is found
                  }
              });
          });
      });
  });
} else if (tabMode === "single") {
    // Single tab mode: open all links in the same single tab every time
    icons.forEach(icon => {
      icon.addEventListener('click', (event) => {
          event.preventDefault(); // Prevent default behavior
          const url = new URL(icon.href); // Parse the URL from the link
          logEvent("ClickedURL", url.href );  // Save the clicked URL in chrome.storage for debugging
          chrome.storage.local.remove("alternativeURL");
          openOrUpdateSingleTab(url.href); // Open or update the single tab
      });
  });
}
else if (tabMode === "new") {
  // New tab mode: open all links in a new tab
  icons.forEach(icon => {
    icon.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default behavior
        chrome.tabs.create({ url: icon.href }); // Open the link in a new tab
    });
});
}
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
          chrome.storage.local.remove({ alternativeURL});
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
  // Convert wildcard (*) in the domain portion into a regex-friendly format
  let regexPattern = pattern
      .replace(/\*/g, '.*') // Replace '*' with '.*'
      .replace(/\//g, '\\/');  // Escape forward slashes for regex
  const regex = new RegExp(`^${regexPattern}$`);
  // Check primary pattern match
  if (regex.test(url)) return true;

  // Check alternative links
  return alternativeLinks.some(alternative => {
    chrome.storage.local.set({ alternativeURL: alternative }); // Save alternative link for debugging
      let altRegexPattern = alternative
          .replace(/\*/g, '.*') // Replace '*' with '.*'
          .replace(/\//g, '\\/');  // Escape forward slashes for regex
          // chrome.storage.local.set({ url: url }); // Save alternative regex pattern for debugging
          // chrome.storage.local.set({ altRegexPattern: altRegexPattern }); // Save alternative regex pattern for debugging
      // Check if the alternative link matches the URL
      return new RegExp(`^${altRegexPattern}$`).test(url);
  });
}


  // About modal
function showAboutModal() {
  const aboutIcon = document.getElementById('about-icon');
  const aboutModal = createModalController('about-modal');
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
document.querySelectorAll('.share-btn').forEach(btn => {
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    const platform = this.getAttribute('data-platform');
    const url = encodeURIComponent(window.location.href);
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
    window.open(shareUrl, '_blank', 'width=600,height=400');
  });
});

// Settings modal
function showSettingsModal() {
    const settingsIcon = document.getElementById('settings-icon');
    const settingsModal = createModalController('settings-modal');
    const saveSettings = document.getElementById('save-settings');
    const themeSelect = document.getElementById('theme');
    const tabModeSelect = document.getElementById('tab-mode');
    const debugModeToggle = document.getElementById('debug-mode');

    const DEFAULT_SETTINGS = {
      theme: 'system',
      debugMode: false,
      tabMode: 'individual'
    };

    const loadSettings = () => {
      chrome.storage.sync.get(DEFAULT_SETTINGS, data => {
        themeSelect.value = data.theme;
        tabModeSelect.value = data.tabMode;
        debugModeToggle.checked = data.debugMode;
        applyTheme(data.theme);
      });
    };

    settingsIcon.addEventListener('click', () => {
      loadSettings();
      settingsModal.openModal(settingsIcon);
    });

    saveSettings.addEventListener('click', () => {
      const tabMode = tabModeSelect.value;  
      const theme = themeSelect.value;
      debugMode = debugModeToggle.checked;
      if (debugMode) {
          console.log("🛠 Debug mode enabled! Logging events...");
      }
      else {
        console.log("🛠 Debug mode disabled");
      }
        chrome.storage.sync.set({ theme, debugMode, tabMode }, () => {
            console.log("✅ Settings saved:", { theme, debugMode, tabMode });
            applyTheme(theme); // Apply theme immediately
            settingsModal.closeModal();
        });
    });

    loadSettings();
};

