/*
 * Copyright © 2026 Cloudrun Ltd
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Custom tiles: storage, validation, icon resolution, tile rendering and the add/edit form.
// Loaded by popup.html and options.html after builtin-tiles.js and ui.js.

const CustomTiles = (() => {
  const SYNC_PREFIX = "customTile:";
  const LOCAL_ICON_PREFIX = "customTileIcon:";
  const STORAGE_ICON_PREFIX = "storage:";
  const LETTER_PREFIX = "letter:";
  const MAX_TILES = 50;
  const MAX_LABEL_LENGTH = 40;
  const MAX_URL_LENGTH = 2048;
  const MAX_PATTERNS = 5;
  const MAX_PATTERN_LENGTH = 512;
  const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
  const MAX_ICON_BYTES = 32 * 1024;
  const ICON_SIZE = 50;
  const PAGES = ["apps", "admin"];
  const MATCH_MODES = ["site", "exact", "pattern"];
  const AVATAR_COLOURS = ["#0284c7", "#4f46e5", "#7c3aed", "#db2777", "#ea580c", "#059669", "#0d9488", "#d97706"];

  let cachedTiles = [];
  let iconCache = new Map();

  // Convert a tile pattern into an anchored regex: '*' becomes '.*' and literal dots/question marks
  // are escaped so URLs are compared as written. Character classes (e.g. [^.-]) and quantifiers
  // (e.g. the '+' in [^.-]+) keep their regex meaning.
  function wildcardToRegExp(pattern) {
    const source = pattern
        .replace(/[.?]/g, '\\$&') // Match '.' and '?' literally
        .replace(/\*/g, '.*'); // Replace '*' with '.*'

    return new RegExp(`^${source}$`);
  }

  // 'site' matches every page on the origin (anchored so "example.com.evil.net" cannot sneak in),
  // 'exact' matches one URL, 'pattern' matches the explicit wildcard patterns.
  function deriveMatch(matchMode, link, patterns) {
    if (matchMode === "exact") {
      return { matchMode: "exact", matchType: "exact", alternativeLinks: [] };
    }

    if (matchMode === "pattern") {
      return { matchMode: "pattern", matchType: "pattern", alternativeLinks: patterns };
    }

    return {
      matchMode: "site",
      matchType: "pattern",
      alternativeLinks: [`${new URL(link).origin}/*`]
    };
  }

  function initials(text) {
    const words = String(text || "").replace(/[^\w\s]/g, " ").trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) return "?";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  function avatarColour(seed) {
    let hash = 0;

    for (const character of String(seed || "")) {
      hash = (hash * 31 + character.codePointAt(0)) % 9973;
    }

    return AVATAR_COLOURS[hash % AVATAR_COLOURS.length];
  }

  // Generated locally: works offline and on machines where the icon was never uploaded.
  function letterAvatar(tile) {
    const label = initials(tile && tile.text);
    const colour = avatarColour((tile && (tile.id || tile.text)) || "");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="50" height="50">` +
      `<rect width="50" height="50" rx="12" fill="${colour}"/>` +
      `<text x="25" y="32" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="20" font-weight="600" fill="#ffffff">${label}</text>` +
      `</svg>`;

    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  function isHttpUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (error) {
      return false;
    }
  }

  // Bundled icons and https URLs render as-is; anything else (letter:, unknown, tampered record)
  // falls back to the generated avatar, so a bad record cannot produce a broken image.
  function resolveIconSrc(tile) {
    const image = String((tile && tile.image) || "");

    if (/^icons\/[\w.-]+\.png$/.test(image)) return image;
    if (isHttpUrl(image)) return image;

    if (image.startsWith(STORAGE_ICON_PREFIX)) {
      const uploaded = iconCache.get(image.slice(STORAGE_ICON_PREFIX.length));

      if (uploaded && uploaded.startsWith("data:image/")) return uploaded;
    }

    return letterAvatar(tile || {});
  }

  function createId() {
    return `ct_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  }

  // chrome.storage.sync content is user editable and arrives from other devices, so every field is
  // re-validated on read instead of being trusted.
  function tileFromStorage(id, value) {
    const record = value && typeof value === "object" ? value : {};
    const link = String(record.link || "");
    const matchMode = MATCH_MODES.includes(record.matchMode) ? record.matchMode : "site";
    const patterns = Array.isArray(record.alternativeLinks) ? record.alternativeLinks.map(String) : [];

    if (!isHttpUrl(link)) {
      return null;
    }

    return {
      schemaVersion: 1,
      id,
      text: String(record.text || ""),
      link,
      page: PAGES.includes(record.page) ? record.page : "apps",
      image: String(record.image || ""),
      order: Number.isFinite(record.order) ? record.order : null,
      createdAt: record.createdAt || null,
      updatedAt: record.updatedAt || null,
      // Matching rules are always derived from matchMode so a stale or edited record cannot end up
      // with a matchType that disagrees with what the editor shows.
      ...deriveMatch(matchMode, link, patterns)
    };
  }

  function isTileKey(key) {
    return typeof key === "string" && key.startsWith(SYNC_PREFIX);
  }

  async function loadCustomTiles() {
    const [items, localItems] = await Promise.all([
      chrome.storage.sync.get(null),
      chrome.storage.local.get(null)
    ]);

    iconCache = new Map();

    Object.keys(localItems)
      .filter(key => key.startsWith(LOCAL_ICON_PREFIX))
      .forEach(key => iconCache.set(key.slice(LOCAL_ICON_PREFIX.length), String(localItems[key] || "")));

    cachedTiles = Object.keys(items)
      .filter(isTileKey)
      .map(key => tileFromStorage(key.slice(SYNC_PREFIX.length), items[key]))
      .filter(tile => tile && tile.text);

    return cachedTiles;
  }

  function getCustomTiles(page) {
    return page ? cachedTiles.filter(tile => tile.page === page) : [...cachedTiles];
  }

  // Custom tiles (which carry an id) sort first, in their saved order; tiles saved before ordering
  // existed have no order and fall in alphabetically after the ordered ones. Built-ins follow.
  function compareTiles(a, b) {
    const aIsCustom = Boolean(a.id);
    const bIsCustom = Boolean(b.id);

    if (aIsCustom !== bIsCustom) return aIsCustom ? -1 : 1;

    const orderA = Number.isFinite(a.order) ? a.order : Number.MAX_SAFE_INTEGER;
    const orderB = Number.isFinite(b.order) ? b.order : Number.MAX_SAFE_INTEGER;

    return orderA - orderB || a.text.localeCompare(b.text);
  }

  function nextOrderFor(page) {
    const orders = cachedTiles
      .filter(tile => tile.page === page && Number.isFinite(tile.order))
      .map(tile => tile.order);

    return orders.length ? Math.max(...orders) + 1 : 0;
  }

  // Writes sequential order values for one page so up/down moves always stay consistent.
  async function moveCustomTile(id, direction) {
    const tile = getTile(id);

    if (!tile) return false;

    const pageTiles = getCustomTiles(tile.page).sort(compareTiles);
    const index = pageTiles.findIndex(candidate => candidate.id === id);
    const target = index + (direction === "up" ? -1 : 1);

    if (index < 0 || target < 0 || target >= pageTiles.length) return false;

    [pageTiles[index], pageTiles[target]] = [pageTiles[target], pageTiles[index]];

    const updates = {};
    pageTiles.forEach((candidate, position) => {
      updates[SYNC_PREFIX + candidate.id] = { ...candidate, order: position };
    });

    await chrome.storage.sync.set(updates);
    await loadCustomTiles();

    return true;
  }

  function getTile(id) {
    return cachedTiles.find(tile => tile.id === id) || null;
  }

  function resolveImageInput(input, errors, tileId) {
    const kind = ["letter", "bundled", "url", "upload"].includes(input.iconKind) ? input.iconKind : "letter";

    if (kind === "upload") {
      const uploaded = String(input.iconData || "");

      if (uploaded) {
        if (!/^data:image\/(png|jpeg|webp|gif);base64,/.test(uploaded) || uploaded.length > MAX_ICON_BYTES) {
          errors.push("That image could not be used. Try a smaller PNG, JPEG or WebP file.");
          return LETTER_PREFIX;
        }

        return STORAGE_ICON_PREFIX + tileId;
      }

      // Editing a tile that already has an uploaded icon without picking a new file keeps it.
      if (String(input.image || "") === STORAGE_ICON_PREFIX + tileId) {
        return STORAGE_ICON_PREFIX + tileId;
      }

      errors.push("Choose an image to upload.");
      return LETTER_PREFIX;
    }

    if (kind === "bundled") {
      const file = String(input.bundledIcon || "");

      if (/^icons\/[\w.-]+\.png$/.test(file)) return file;

      errors.push("Choose a built-in icon.");
      return LETTER_PREFIX;
    }

    if (kind === "url") {
      const url = String(input.iconUrl || "").trim();

      if (!url) return LETTER_PREFIX;

      if (url.length > MAX_URL_LENGTH || !isHttpUrl(url)) {
        errors.push("The icon URL must start with http:// or https://.");
        return LETTER_PREFIX;
      }

      return url;
    }

    return LETTER_PREFIX;
  }

  // Returns { ok, errors, warnings, tile }. 'tile' is the normalised record to persist.
  function validateTile(input) {
    const errors = [];
    const warnings = [];
    const text = String(input.text || "").trim();
    const rawLink = String(input.link || "").trim();
    const page = PAGES.includes(input.page) ? input.page : "apps";
    const matchMode = MATCH_MODES.includes(input.matchMode) ? input.matchMode : "site";
    const editingId = input.id || createId(); // New tiles get their id up front so uploads can be keyed by it

    if (!text) {
      errors.push("Enter a label.");
    } else if (text.length > MAX_LABEL_LENGTH) {
      errors.push(`Keep the label to ${MAX_LABEL_LENGTH} characters or fewer.`);
    }

    let link = "";
    if (!rawLink) {
      errors.push("Enter a URL.");
    } else if (rawLink.length > MAX_URL_LENGTH) {
      errors.push("That URL is too long.");
    } else if (!isHttpUrl(rawLink)) {
      errors.push("The URL must start with http:// or https://.");
    } else {
      link = new URL(rawLink).href; // Normalised so tile.link === anchor.href
    }

    let patterns = [];
    if (matchMode === "pattern") {
      patterns = String(input.patterns || "").split(/\r?\n/).map(line => line.trim()).filter(Boolean);

      if (patterns.length === 0) {
        errors.push("Add at least one match pattern.");
      } else if (patterns.length > MAX_PATTERNS) {
        errors.push(`Use ${MAX_PATTERNS} patterns or fewer.`);
      }

      patterns.forEach(pattern => {
        if (pattern.length > MAX_PATTERN_LENGTH) {
          errors.push("A match pattern is too long.");
          return;
        }

        try {
          wildcardToRegExp(pattern);
        } catch (error) {
          errors.push(`"${pattern}" is not a valid pattern.`);
        }
      });
    }

    const image = resolveImageInput(input, errors, editingId);
    const match = link ? deriveMatch(matchMode, link, patterns) : { matchMode, matchType: "pattern", alternativeLinks: [] };

    if (link) {
      const duplicate = cachedTiles.find(tile => tile.id !== editingId && tile.page === page && tile.link === link);

      if (duplicate) {
        warnings.push(`"${duplicate.text}" already opens this URL.`);
      }

      const builtin = typeof getBuiltinIcons === "function"
        ? getBuiltinIcons().find(icon => icon.link === link)
        : null;

      if (builtin) {
        warnings.push(`The built-in "${builtin.text}" tile already opens this URL.`);
      }
    }

    return {
      ok: errors.length === 0,
      errors,
      warnings,
      tile: {
        schemaVersion: 1,
        id: editingId,
        text,
        link,
        page,
        image,
        order: Number.isFinite(input.order) ? input.order : null,
        createdAt: input.createdAt || null,
        ...match
      }
    };
  }

  async function saveCustomTile(input) {
    const result = validateTile(input);

    if (!result.ok) return result;

    const existing = getTile(result.tile.id);
    const isNew = !existing;

    if (isNew && cachedTiles.length >= MAX_TILES) {
      return { ...result, ok: false, errors: [`You can keep up to ${MAX_TILES} custom tiles.`] };
    }

    const now = new Date().toISOString();
    const tile = {
      ...result.tile,
      // New tiles go to the end of their page; tiles moved to another page get a fresh slot.
      order: !existing || existing.page !== result.tile.page ? nextOrderFor(result.tile.page) : existing.order,
      createdAt: result.tile.createdAt || now,
      updatedAt: now
    };

    const uploadedIcon = String(input.iconData || "") && tile.image === STORAGE_ICON_PREFIX + tile.id
      ? String(input.iconData)
      : null;

    if (uploadedIcon) {
      await chrome.storage.local.set({ [LOCAL_ICON_PREFIX + tile.id]: uploadedIcon });
    }

    try {
      await chrome.storage.sync.set({ [SYNC_PREFIX + tile.id]: tile });
    } catch (error) {
      console.error("Saving custom tile failed", error);

      if (uploadedIcon) {
        await chrome.storage.local.remove(LOCAL_ICON_PREFIX + tile.id);
      }

      return { ...result, ok: false, errors: ["Chrome could not save the tile. Storage may be full."] };
    }

    await loadCustomTiles();
    return { ...result, tile };
  }

  async function deleteCustomTile(id) {
    await chrome.storage.sync.remove(SYNC_PREFIX + id);
    await chrome.storage.local.remove(LOCAL_ICON_PREFIX + id);
    await loadCustomTiles();
  }

  // Single source of truth for tile markup; user-supplied text is always set via textContent.
  function buildTileElement(tile) {
    const link = document.createElement("a");

    link.href = tile.link;
    link.target = "_blank";
    link.className = "app-icon";

    if (tile.id) {
      link.dataset.tileId = tile.id;
    }

    const item = document.createElement("div");
    item.className = "icon-item";

    const image = document.createElement("img");
    image.src = resolveIconSrc(tile);
    image.alt = tile.text;
    image.className = "h-auto max-w-[35px]";

    const label = document.createElement("p");
    label.className = "mt-2 line-clamp-2 text-[11px] font-medium text-slate-700 dark:text-slate-200";
    label.textContent = tile.text;

    item.append(image, label);
    link.append(item);

    return link;
  }

  // ---- add/edit form ----------------------------------------------------

  let formModal = null;
  let formController = null;
  let formState = { tile: null, draftId: null, iconData: "", page: "apps", onSaved: null };

  function formEl(id) {
    return document.getElementById(id);
  }

  function buildForm() {
    const shell = document.createElement("div");

    shell.id = "tile-form-modal";
    shell.className = "modal-shell";
    shell.dataset.open = "false";
    shell.tabIndex = -1;
    shell.setAttribute("role", "dialog");
    shell.setAttribute("aria-modal", "true");
    shell.setAttribute("aria-labelledby", "tile-form-title");
    shell.setAttribute("aria-hidden", "true");
    shell.innerHTML = `
      <div class="relative my-4 w-full max-w-sm max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-5 shadow-panel dark:border-slate-700 dark:bg-slate-900">
        <button type="button" data-close-modal class="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100" aria-label="Close tile dialog">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
          </svg>
        </button>
        <h2 id="tile-form-title" class="text-lg font-semibold text-slate-900 dark:text-slate-50">Add tile</h2>
        <form id="tile-form" class="mt-4 space-y-3" novalidate>
          <div>
            <label for="tile-label" class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Label</label>
            <input id="tile-label" type="text" class="panel-select" maxlength="${MAX_LABEL_LENGTH}" autocomplete="off" placeholder="Contoso Wiki" required>
          </div>
          <div>
            <label for="tile-link" class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">URL</label>
            <input id="tile-link" type="url" class="panel-select" autocomplete="off" placeholder="https://contoso.sharepoint.com/sites/wiki" required>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="tile-page" class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Show on</label>
              <select id="tile-page" class="panel-select">
                <option value="apps">Apps</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label for="tile-match" class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Match tabs</label>
              <select id="tile-match" class="panel-select">
                <option value="site">Any page on this site</option>
                <option value="exact">This exact page</option>
                <option value="pattern">Custom pattern</option>
              </select>
            </div>
          </div>
          <div id="tile-pattern-row" class="hidden">
            <label for="tile-patterns" class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Patterns</label>
            <textarea id="tile-patterns" rows="3" class="panel-select" placeholder="https://*.example.com/*"></textarea>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">One per line. <code>*</code> matches any text.</p>
          </div>
          <div>
            <label for="tile-icon-kind" class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Icon</label>
            <div class="flex items-center gap-2">
              <select id="tile-icon-kind" class="panel-select">
                <option value="letter">Initials</option>
                <option value="bundled">Built-in icon</option>
                <option value="url">Image URL</option>
                <option value="upload">Upload image</option>
              </select>
              <img id="tile-icon-preview" alt="" class="h-10 w-10 shrink-0 rounded-lg border border-slate-200 bg-slate-50 object-contain p-0.5 dark:border-slate-700 dark:bg-slate-800">
            </div>
          </div>
          <div id="tile-bundled-row" class="hidden">
            <label for="tile-bundled" class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Built-in icon</label>
            <select id="tile-bundled" class="panel-select"></select>
          </div>
          <div id="tile-icon-url-row" class="hidden">
            <label for="tile-icon-url" class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Image URL</label>
            <input id="tile-icon-url" type="url" class="panel-select" autocomplete="off" placeholder="https://example.com/icon.png">
          </div>
          <div id="tile-upload-row" class="hidden">
            <label for="tile-icon-file" class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Image file</label>
            <input id="tile-icon-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" class="panel-select text-xs file:mr-2 file:rounded-md file:border-0 file:bg-sky-100 file:px-2 file:py-1 file:text-xs file:font-medium file:text-sky-700 dark:file:bg-sky-500/20 dark:file:text-sky-100">
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Resized to ${ICON_SIZE}x${ICON_SIZE} and kept on this device.</p>
          </div>
          <p id="tile-form-error" role="alert" class="hidden rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200"></p>
          <p id="tile-form-warning" class="hidden rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100"></p>
          <div class="flex justify-end gap-2 pt-1">
            <button type="button" class="panel-button-secondary" data-close-modal>Cancel</button>
            <button type="submit" class="panel-button" id="tile-form-save">Save</button>
          </div>
        </form>
      </div>`;

    document.body.appendChild(shell);

    formEl("tile-match").addEventListener("change", syncRows);
    formEl("tile-icon-kind").addEventListener("change", syncRows);
    formEl("tile-bundled").addEventListener("change", updatePreview);
    formEl("tile-icon-url").addEventListener("input", updatePreview);
    formEl("tile-icon-file").addEventListener("change", handleIconFileChange);
    formEl("tile-link").addEventListener("blur", handleLinkBlur);
    formEl("tile-label").addEventListener("input", () => {
      hideMessages();
      updatePreview();
    });
    formEl("tile-link").addEventListener("input", hideMessages);
    formEl("tile-form").addEventListener("submit", handleSubmit);

    return shell;
  }

  function syncRows() {
    const iconKind = formEl("tile-icon-kind").value;

    formEl("tile-pattern-row").classList.toggle("hidden", formEl("tile-match").value !== "pattern");
    formEl("tile-bundled-row").classList.toggle("hidden", iconKind !== "bundled");
    formEl("tile-icon-url-row").classList.toggle("hidden", iconKind !== "url");
    formEl("tile-upload-row").classList.toggle("hidden", iconKind !== "upload");
    updatePreview();
  }

  function updatePreview() {
    const input = collectInput();
    const preview = formEl("tile-icon-preview");
    let image = "";

    if (input.iconKind === "upload") {
      image = formState.iconData;

      if (!image && formState.tile) {
        image = formState.tile.image;
      }
    } else if (input.iconKind === "bundled") {
      image = input.bundledIcon;
    } else if (input.iconKind === "url") {
      image = input.iconUrl.trim();
    }

    if (image.startsWith("data:image/")) {
      preview.src = image;
      return;
    }

    preview.src = resolveIconSrc({ text: input.text, id: input.id, image });
  }

  function hideMessages() {
    formEl("tile-form-error").classList.add("hidden");
    formEl("tile-form-warning").classList.add("hidden");
  }

  function showMessages(errors = [], warnings = []) {
    const errorBox = formEl("tile-form-error");
    const warningBox = formEl("tile-form-warning");

    errorBox.textContent = errors.join(" ");
    errorBox.classList.toggle("hidden", errors.length === 0);
    warningBox.textContent = warnings.join(" ");
    warningBox.classList.toggle("hidden", warnings.length === 0);
  }

  function collectInput() {
    return {
      // New tiles reserve their id when the form opens so an upload can be keyed by it.
      id: formState.tile ? formState.tile.id : formState.draftId,
      createdAt: formState.tile && formState.tile.createdAt,
      order: formState.tile && formState.tile.order,
      image: formState.tile && formState.tile.image,
      text: formEl("tile-label").value,
      link: formEl("tile-link").value,
      page: formEl("tile-page").value,
      matchMode: formEl("tile-match").value,
      patterns: formEl("tile-patterns").value,
      iconKind: formEl("tile-icon-kind").value,
      bundledIcon: formEl("tile-bundled").value,
      iconUrl: formEl("tile-icon-url").value,
      iconData: formState.iconData
    };
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("The file could not be read."));
      reader.readAsDataURL(file);
    });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("That image could not be decoded."));
      image.src = src;
    });
  }

  // Normalises any picked image to a 50x50 PNG data URL so storage stays small and predictable.
  async function downscaleIcon(file) {
    if (!file || !String(file.type || "").startsWith("image/")) {
      throw new Error("Choose an image file.");
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error("Images must be 2 MB or smaller.");
    }

    const image = await loadImage(await readFileAsDataUrl(file));
    const canvas = document.createElement("canvas");

    canvas.width = ICON_SIZE;
    canvas.height = ICON_SIZE;

    const sourceWidth = image.width || ICON_SIZE;
    const sourceHeight = image.height || ICON_SIZE;
    const scale = Math.min(ICON_SIZE / sourceWidth, ICON_SIZE / sourceHeight);
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));

    canvas.getContext("2d").drawImage(
      image,
      (ICON_SIZE - width) / 2,
      (ICON_SIZE - height) / 2,
      width,
      height
    );

    const dataUrl = canvas.toDataURL("image/png");

    if (dataUrl.length > MAX_ICON_BYTES) {
      throw new Error("That image is too large once resized.");
    }

    return dataUrl;
  }

  async function handleIconFileChange() {
    const file = formEl("tile-icon-file").files && formEl("tile-icon-file").files[0];

    formState.iconData = "";

    if (!file) {
      updatePreview();
      return;
    }

    try {
      formState.iconData = await downscaleIcon(file);
      showMessages();
    } catch (error) {
      formState.iconData = "";
      showMessages([error.message]);
    }

    updatePreview();
  }

  // When the URL matches an open tab, borrow its title and favicon so the user types less.
  function handleLinkBlur() {
    const input = collectInput();
    const result = validateTile(input);

    // Errors are only surfaced on submit; here we just warn about duplicates.
    showMessages([], result.warnings);

    if (formState.tile && formState.tile.id) return; // Editing: never overwrite existing values
    if (!isHttpUrl(input.link.trim())) return;

    const origin = new URL(input.link.trim()).origin;

    chrome.tabs.query({}, tabs => {
      const match = tabs.find(tab => tab.url && tab.url.startsWith(origin));

      if (!match) return;

      if (!formEl("tile-label").value.trim() && match.title) {
        formEl("tile-label").value = match.title.trim().slice(0, MAX_LABEL_LENGTH);
      }

      if (formEl("tile-icon-kind").value === "letter"
        && !formEl("tile-icon-url").value.trim()
        && isHttpUrl(match.favIconUrl)) {
        formEl("tile-icon-kind").value = "url";
        formEl("tile-icon-url").value = match.favIconUrl;
        syncRows();
      }
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const saveButton = formEl("tile-form-save");
    saveButton.disabled = true;

    try {
      const result = await CustomTiles.saveCustomTile(collectInput());

      if (!result.ok) {
        showMessages(result.errors, result.warnings);
        return;
      }

      hideMessages();
      formState.iconData = "";
      if (typeof formState.onSaved === "function") formState.onSaved(result.tile);
      formController.closeModal();
    } finally {
      saveButton.disabled = false;
    }
  }

  function populateBundledIcons(selected) {
    const select = formEl("tile-bundled");

    if (select.options.length === 0) {
      const seen = new Set();
      const icons = typeof getBuiltinIcons === "function" ? getBuiltinIcons() : [];

      icons.forEach(icon => {
        if (seen.has(icon.image)) return;

        seen.add(icon.image);

        const option = document.createElement("option");
        option.value = icon.image;
        option.textContent = icon.text;
        select.appendChild(option);
      });
    }

    if (selected) select.value = selected;
  }

  function populateForm(options) {
    const tile = options.tile || null;

    formEl("tile-form-title").textContent = tile ? "Edit tile" : "Add tile";
    formEl("tile-label").value = tile ? tile.text : "";
    formEl("tile-link").value = tile ? tile.link : "";
    formEl("tile-page").value = tile ? tile.page : (options.page || "apps");
    formEl("tile-match").value = tile ? tile.matchMode : "site";
    formEl("tile-patterns").value = tile && tile.matchMode === "pattern" ? tile.alternativeLinks.join("\n") : "";

    let iconKind = "letter";

    if (tile && /^icons\//.test(tile.image)) {
      iconKind = "bundled";
    } else if (tile && isHttpUrl(tile.image)) {
      iconKind = "url";
    } else if (tile && tile.image.startsWith(STORAGE_ICON_PREFIX)) {
      iconKind = "upload";
    }

    formEl("tile-icon-kind").value = iconKind;
    formEl("tile-icon-url").value = iconKind === "url" ? tile.image : "";
    formEl("tile-icon-file").value = ""; // File inputs cannot be prefilled
    formState.iconData = "";
    populateBundledIcons(iconKind === "bundled" ? tile.image : "");

    hideMessages();
    syncRows();
  }

  // options: { tile, page, onSaved }
  function openTileForm(options = {}) {
    if (!formModal) {
      formModal = buildForm();
      formController = UI.createModalController("tile-form-modal");
    }

    formState = {
      tile: options.tile || null,
      draftId: options.tile ? null : createId(),
      iconData: "",
      page: options.page || "apps",
      onSaved: options.onSaved || null
    };

    populateForm(options);
    formController.openModal(document.activeElement);
  }

  return {
    MAX_TILES,
    wildcardToRegExp,
    resolveIconSrc,
    buildTileElement,
    isTileKey,
    compareTiles,
    loadCustomTiles,
    getCustomTiles,
    getTile,
    validateTile,
    saveCustomTile,
    deleteCustomTile,
    moveCustomTile,
    openTileForm
  };
})();
