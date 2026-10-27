# 365 Launcher — development notes

Chrome/Edge MV3 extension (popup-only, no background service worker or content scripts). A compact grid of
Microsoft 365 app and admin-portal tiles that focuses an already-open tab instead of opening a duplicate.

Copyright © 2026 Cloudrun Ltd, MPL-2.0.

## File map

| File | Role |
| --- | --- |
| [popup.html](../popup.html) | Entire UI: header (view toggle, refresh toggle, search, About, Settings), two tile grids, About modal, Settings modal, status bar, single `<script src="popup.js">` at the end of `<body>` |
| [popup.js](../popup.js) | All logic and the tile data model (single file, no modules, no build step for JS) |
| [theme-init.js](../theme-init.js) | Synchronous `<head>` bootstrap that applies the saved theme before first paint (no flash) |
| [manifest.json](../manifest.json) | MV3 manifest; permissions `tabs` + `storage`; icons under `icons/` |
| [styles/tailwind.css](../styles/tailwind.css) | Tailwind source (`@layer base/components`) — this is the file to edit |
| [assets/tailwind.css](../assets/tailwind.css) | **Generated** minified output; committed and loaded by `popup.html`. Never edit by hand |
| [tailwind.config.js](../tailwind.config.js) | `content` = `popup.html` + `popup.js`; `darkMode: "class"`; custom `shadow-panel` |
| [changelog.json](../changelog.json) | `release_date` + `changes[]` rendered into the About modal |
| [icons/](../icons) | 50x50 service icons plus `icon16/32/48/128.png` extension icons |
| [images/](../images) | Light/dark logos shown in the About modal |

## Style pipeline

```bash
npm install              # tailwindcss 3.x only devDependency
npm run build:css        # styles/tailwind.css -> assets/tailwind.css (minified)
npm run dev:css          # same, --watch
```

`assets/tailwind.css` is committed and must be rebuilt after any change to `popup.html`, `popup.js`
(class strings), `styles/tailwind.css`, or `tailwind.config.js`. If you forget, new utility classes
silently render unstyled. Verify with `npm run build:css && git diff --stat assets/tailwind.css`
(an empty diff means the committed bundle was already current).

## Tile data model

Two module-level arrays in [popup.js](../popup.js): `appIcons` (Apps page) and `adminIcons` (Admin page).
Each entry is an `IconItem(image, link, text, matchType, alternativeLinks = [])`:

- `image` — path relative to the extension root, e.g. `icons/Excel_50x50.png`.
- `link` — the URL opened when no existing tab matches; also the sort key target and the
  identity used in Individual mode (`item.link === icon.href`, so the string must be a URL that the
  browser normalises to itself — no stray relative paths).
- `text` — display label, also the target of the search filter (`includes`, case-insensitive).
- `matchType`:
  - `exact` — focus a tab whose `url` is identical to `link`.
  - `startsWith` — focus the first tab whose `url` starts with `link`.
  - `pattern` — `matchPattern(link, tab.url, alternativeLinks)` → `wildcardToRegExp()`. Patterns are
    plain URLs where `*` becomes `.*`, `.` and `?` always match literally, and character classes such as
    `[^.-]` plus quantifiers such as the `+` in `[^.-]+` are passed through as regex. `link` itself is
    treated as a pattern too, so entries using `pattern` normally set `link` to the plain launch URL and
    put the wildcard expressions in `alternativeLinks`.
- `alternativeLinks` — extra wildcard patterns (e.g. `https://*-my.sharepoint.com/...`).

Both grids are sorted alphabetically by `text` at render time via `getFilteredIcons()`; add new entries
anywhere in the array.

### Adding a tile

1. Drop a 50x50 PNG in `icons/`. If the artwork has no border, scale the art to ~44px and pad the canvas
   back to 50px (see `icons/icons_readme.txt`).
2. Append an `IconItem` to `appIcons` or `adminIcons` with the right `matchType`.
3. Rebuild CSS only if you also touched markup/classes.
4. Reload the extension in `chrome://extensions` — the popup is not hot-reloaded and `manifest.json`
   changes (e.g. version strings) require a reload.

## Runtime flow

`DOMContentLoaded` in [popup.js](../popup.js) calls, in order: `togglePages()`, `setupSearchFilter()`,
`renderFilteredPages()`, `focusSearchInput()`, `showAboutModal()`, `showSettingsModal()`,
`setupKeyboardShortcuts()`, `setupStatusBar()`.

- `renderFilteredPages()` re-renders both grids from `activeSearchText`, announces counts to the
  `#search-status` live region, and re-runs `initializeTabMode()`. Anything that re-renders tiles must go
  through this function.
- Tile clicks are **delegated**: `initializeTabMode()` binds one `click` listener per grid (guarded by
  `tabModeListenerBound`, so it only ever runs once) and `handleIconClick()` resolves the clicked
  `.app-icon` with `event.target.closest()`. The tab mode is cached in `activeTabMode` (loaded once from
  `storage.sync`, updated when Settings are saved), so re-rendering on every keystroke does not hit
  storage and handlers are never attached twice.
- `togglePages()` reads `switchState`/`debugMode`/`refreshState`, wires the Apps/Admin switch (icon path +
  label swap) and the Refresh toggle, and mirrors all three to `chrome.storage.sync`.
- Every tile is an `<a href target="_blank">`; each tab mode calls `event.preventDefault()` and drives
  `chrome.tabs` itself.
- Modals use `createModalController()`: focus trap on Tab, restore focus on close, backdrop click and
  `[data-close-modal]` close it, and a document-level Escape handler closes the top-most open
  `.modal-shell[data-open="true"]` (the controller is stashed on the element as `__closeModal`).
- Theme: [theme-init.js](../theme-init.js) runs in `<head>`, reads the `theme` value mirrored into
  `localStorage` by `applyTheme()`, and sets `data-theme` on `<html>` plus the `dark` class before first
  paint. `applyTheme()` then re-resolves `system` via `prefers-color-scheme` and rewrites both. Do not
  add inline scripts — the manifest CSP only allows `script-src 'self'`. All dark styling in
  `popup.html`/`styles/tailwind.css` is keyed off `data-theme`/`.dark` — match the existing
  `dark:` pattern when adding UI.

## Tab modes

Selected in Settings, stored as `tabMode`, read by `initializeTabMode()`:

| Mode | Behaviour | Helper |
| --- | --- | --- |
| `individual` (default) | Find a matching existing tab across all windows and focus it (optional reload via the Refresh toggle), otherwise open the link | `openOrFocusTab()` |
| `single` | Reuse one dedicated tab whose id is persisted in `storage.local.myTabId`; navigate it to each new tile | `openOrUpdateSingleTab()` / `createNewTab()` |
| `new` | Always `chrome.tabs.create()` | — |

## Storage keys

`chrome.storage.sync` (user settings, survives browsers/profile sync):
`switchState` (Admin view on), `refreshState` (reload matched tab), `tabMode`, `theme`, `debugMode`.

`localStorage` (same extension origin, synchronous): `theme` — mirror of the `theme` setting used only
by `theme-init.js` for the no-flash first paint.

`chrome.storage.local` (per-machine state / diagnostics):
`myTabId` (single-tab-mode tab id), `alternativeURL` (last alternative pattern used for debugging),
and, only while `debugMode` is on, arbitrary log keys written by `logEvent()` (`message`, `ClickedURL`,
`url`, …). `logEvent(keyOrMessage, message?)` no-ops unless debug mode is on.

## Keyboard shortcuts (`setupKeyboardShortcuts`)

- `/` or `Ctrl/Cmd+K` — focus the search box (ignored while a modal is open or when typing).
- `Escape` in search — clear the filter and re-render.
- Arrow keys — move focus across the 6-column grid of the visible page (first arrow press moves focus
  from the search box to the first tile).
- `Enter` in search — open the first visible tile.

## Known issues / gotchas

- `wildcardToRegExp()` deliberately keeps regex constructs other than `*`, `.` and `?` intact so that
  existing patterns like `[^.-]+` keep working. That means a pattern containing `+`, `(`, `)`, `|`, `$`
  or `^` outside a character class is still interpreted as regex — keep new patterns to literal text,
  `*`, and simple `[...]` classes.
- `matchPattern()` stores the matching alternative in `storage.local.alternativeURL` for debugging, so
  the last match is written on every successful tab scan. Diagnostic only.
- The About modal's share buttons intentionally share `SHARE_URL` (the public product page) rather than
  `window.location`, which would be the unusable `chrome-extension://…/popup.html` URL.
- `changelog.json` is hand-maintained and its version heading (`2.1.2:` today) can drift from
  `manifest.json`'s `version`; bump both together (the About modal shows them side by side).
- There are no automated tests or linters in the repo — see *Manual testing*.
- `node_modules/` and `.DS_Store` are git-ignored as of the hygiene fix; keep it that way.

## Release checklist

1. Bump `manifest.json` `version` (and `package.json` + `npm install --package-lock-only` to keep
   the lockfile in sync).
2. Update `changelog.json` (`release_date`, prepend the version heading and bullets). The About modal
   prefixes bullets with ✨/🔧/🚀/🔄 based on whether the text contains Added/Fixed/Improved|Optimized/Updated.
3. `npm run build:css` and commit the regenerated `assets/tailwind.css`.
4. Reload the unpacked extension and sanity-check both pages, search, keyboard nav, all three tab modes,
   and light/dark/system themes.

## Manual testing

There are no automated tests, linters, or build steps for `popup.js`. Validate with:

```bash
node --check popup.js && node --check theme-init.js
python3 -m json.tool manifest.json >/dev/null && python3 -m json.tool changelog.json >/dev/null
npm run build:css && git diff --stat assets/tailwind.css
```

then load the folder via `chrome://extensions` → *Load unpacked* and exercise the popup. Note that
`popup.js` exits early outside an extension context (`chrome.runtime.getManifest()` at the top level), so
it cannot be smoke-tested by opening `popup.html` as a plain `file://` page.
