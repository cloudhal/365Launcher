# 365 Launcher — development notes

Chrome/Edge MV3 extension (no background service worker, no content scripts) with a popup that shows a
compact grid of Microsoft 365 app and admin-portal tiles and focuses an already-open tab instead of
opening a duplicate, plus a full-tab options page for user-defined custom tiles.

Copyright © 2026 Cloudrun Ltd, MPL-2.0.

## File map

| File | Role |
| --- | --- |
| [popup.html](../popup.html) | Popup UI: header (view toggle, refresh toggle, search, About, Settings), two tile grids, About/Settings modals, status bar. Loads `ui.js`, `builtin-tiles.js`, `custom-tiles.js`, then `popup.js` |
| [popup.js](../popup.js) | Popup behaviour: theming, grids, search, keyboard nav, tab modes, modals wiring |
| [builtin-tiles.js](../builtin-tiles.js) | `IconItem` class plus the `appIcons` / `adminIcons` data arrays; `getBuiltinIcons()` |
| [custom-tiles.js](../custom-tiles.js) | Custom tiles: storage CRUD, validation, match derivation, icon resolution, `buildTileElement()`, and the shared add/edit form (loaded by both pages) |
| [ui.js](../ui.js) | `UI.createModalController()` — focus-trapping modal helper plus the global Escape handler |
| [options.html](../options.html) / [options.js](../options.js) | Full-tab manager for custom tiles (list, edit, delete); registered via `options_ui` |
| [theme-init.js](../theme-init.js) | Synchronous `<head>` bootstrap that applies the saved theme before first paint (no flash) |
| [manifest.json](../manifest.json) | MV3 manifest; permissions `tabs` + `storage`; icons under `icons/` |
| [styles/tailwind.css](../styles/tailwind.css) | Tailwind source (`@layer base/components`) — this is the file to edit |
| [assets/tailwind.css](../assets/tailwind.css) | **Generated** minified output; committed and loaded by `popup.html`. Never edit by hand |
| [tailwind.config.js](../tailwind.config.js) | `content` = popup + options pages and their scripts, including `custom-tiles.js`; `darkMode: "class"`; custom `shadow-panel` |
| [changelog.json](../changelog.json) | `release_date` + `changes[]` rendered into the About modal |
| [icons/](../icons) | 50x50 service icons plus `icon16/32/48/128.png` extension icons |
| [images/](../images) | Light/dark logos shown in the About modal |

## Style pipeline

```bash
npm install              # tailwindcss 3.x only devDependency
npm run build:css        # styles/tailwind.css -> assets/tailwind.css (minified)
npm run dev:css          # same, --watch
```

`assets/tailwind.css` is committed and must be rebuilt after any change to `popup.html`, `popup.js`,
`options.html`, `options.js`, `custom-tiles.js` (class strings), `styles/tailwind.css`, or
`tailwind.config.js` — any new file that contains Tailwind classes must also be added to the
`content` globs. If you forget, new utility classes
silently render unstyled. Verify with `npm run build:css && git diff --stat assets/tailwind.css`
(an empty diff means the committed bundle was already current).

## Tile data model

Two arrays in [builtin-tiles.js](../builtin-tiles.js): `appIcons` (Apps page) and `adminIcons` (Admin page).
Each entry is an `IconItem(image, link, text, matchType, alternativeLinks = [])`. Custom tiles use the same
shape and are merged in front of the built-ins by `getAllIcons(page)` in [popup.js](../popup.js:224), so a
user tile wins over a built-in with the same link.

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

## Custom tiles

Users add their own tiles from the popup or the options page; both pages load
[custom-tiles.js](../custom-tiles.js), which owns the whole feature.

### Record shape

One `chrome.storage.sync` key per tile, prefix `customTile:`:

```js
{
  schemaVersion: 1,
  id: "ct_lq8x2k7f3a",
  text: "Contoso Wiki",
  link: "https://contoso.sharepoint.com/sites/wiki",  // normalised via new URL().href
  page: "apps",                                       // "apps" | "admin"
  matchMode: "site",                                  // "site" | "exact" | "pattern"
  matchType: "pattern",                               // derived, consumed by openOrFocusTab()
  alternativeLinks: ["https://contoso.sharepoint.com/*"],
  image: "letter:",                                   // "icons/X.png" | https URL | "letter:" | "storage:<id>"
  order: 0,                                           // position on its page; null for pre-2.3 records
  createdAt, updatedAt
}
```

- **One key per tile, not one array**, because `storage.sync` allows ~100 KB total but only 8 KB per
  item; an array would hit that ceiling after ~25 tiles and one failed write would lose everything.
  `loadCustomTiles()` reads all keys and filters by prefix. The UI caps users at `MAX_TILES` (50).
- **`matchMode` is the source of truth.** `tileFromStorage()` re-derives `matchType` /
  `alternativeLinks` on every read via `deriveMatch()`, so a stale, hand-edited or cross-device record
  can never end up with matching rules that disagree with what the editor shows.
  - `site` → `pattern` with `alternativeLinks: [origin + "/*"]` (anchored, so `example.com.evil.net`
    cannot match `example.com`; a plain `startsWith` would).
  - `exact` → `matchType: "exact"`.
  - `pattern` → the user's wildcard patterns, validated with `wildcardToRegExp()` before saving.
- **Records are treated as untrusted input**: `tileFromStorage()` drops tiles whose link is not
  http(s), clamps unknown `page`/`matchMode` values to defaults, and `resolveIconSrc()` renders anything
  that is not an `icons/*.png` path or an http(s) URL as a generated letter avatar. `validateTile()`
  enforces the same rules plus length limits on write.
- **Icons never live in `sync`**: `letter:` renders a local SVG data URL, `icons/...` is bundled, an
  https URL is remote, and `storage:<id>` points at an uploaded icon stored in `storage.local` under
  `customTileIcon:<id>`. `loadCustomTiles()` preloads those into `iconCache` so rendering stays
  synchronous; if the local icon is missing (new machine, cleared data) `resolveIconSrc()` falls back to
  the letter avatar. Uploads are decoded, drawn onto a 50x50 canvas and re-encoded as PNG (≤ 32 KB).

### Ordering

- `compareTiles()` sorts custom tiles (anything with an `id`) **first**, by their `order`, then
  alphabetically; tiles saved before ordering existed (`order: null`) fall in alphabetically after the
  ordered ones, and built-ins (no `id`) follow alphabetically. The popup's `getFilteredIcons()` uses this
  comparator directly, so the grid always matches the options-page list.
- `order` is per page. `saveCustomTile()` appends new tiles (and tiles moved to the other page) via
  `nextOrderFor()`. `moveCustomTile(id, "up" | "down")` swaps with the neighbour and rewrites **all**
  tiles on that page with sequential orders, which also normalises legacy `null` values the first time
  anything is moved. The options page disables ↑ on the first row and ↓ on the last row of each page.

### Rendering and matching

- `getAllIcons(page)` merges custom tiles (custom first) with the built-ins; rendering, search counts,
  sorting and keyboard navigation all flow through it.
- `buildTileElement()` builds every tile with `createElement` + `textContent` — do not go back to
  `innerHTML` templates for tile markup, because labels are user-supplied.
- Custom tiles carry `data-tile-id`; `handleIconClick()` resolves them by id and falls back to the
  `item.link === icon.href` comparison for built-ins (an `<a href>` normalises `https://x` to
  `https://x/`, so custom links are normalised on save for the same reason).
- A `+` tile (`[data-add-tile]`, `buildAddTileButton()`) is appended to each grid when no search is
  active and opens the add form.

### Add/edit form

`CustomTiles.openTileForm({ tile, page, onSaved })` injects a single modal into `document.body` on first
use and reuses it afterwards; it is shared by the popup (`+` tile) and the options page (Add/Edit). On
URL blur it borrows the title and favicon of a matching open tab (`chrome.tabs.query`, already permitted)
when adding a tile, so the user usually only pastes a URL; blur only shows duplicate warnings, errors
appear on submit.

New tiles reserve their id when the form opens (`formState.draftId`) so an uploaded icon can be keyed by
`customTileIcon:<id>` before the record exists. `handleSubmit` writes `storage.local` first, then the sync
record, and rolls the icon back if the sync write fails.

### Export / import

`exportTiles()` builds a portable document; the options page turns it into a download
(`Blob` + `URL.createObjectURL`, file named `365-launcher-tiles-YYYY-MM-DD.json`):

```json
{
  "app": "365-launcher",
  "schemaVersion": 1,
  "exportedAt": "2026-10-27T16:00:00.000Z",
  "tiles": [
    { "text": "Contoso Wiki", "link": "https://contoso.sharepoint.com/sites/wiki",
      "page": "apps", "matchMode": "site", "icon": { "kind": "letter" } }
  ]
}
```

- `icon.kind` is `letter` | `bundled` (`path`) | `url` (`url`) | `embedded` (`data`, a 50x50 PNG data
  URL). Uploaded icons are embedded so a file moves between machines; they are re-stored in
  `storage.local` under the importing tile's new id.
- `patterns` is present only for `matchMode: "pattern"` (for `site`/`exact` the rules are re-derived).
  Derived `matchType`/`alternativeLinks` are deliberately **not** exported.
- Array order is the display order (page-grouped, then `order`); `order` itself is not exported and
  imported tiles are appended to their page.
- `importTiles(jsonText)` never overwrites: every accepted tile gets a fresh id, and entries whose
  page + normalised link already exist are skipped, so importing the same file twice is a no-op. It
  enforces the same `MAX_TILES` cap and returns `{ ok, imported, skipped, errors }`; malformed JSON,
  a missing `tiles` array, and a `schemaVersion` newer than `EXPORT_SCHEMA_VERSION` are fatal errors.
  If a future schema needs migrating, bump `EXPORT_SCHEMA_VERSION` and convert older documents there.

### Options page

[options.html](../options.html) is registered as `options_ui` with `open_in_tab: true` and is reached from
Settings → *Manage custom tiles* (`chrome.runtime.openOptionsPage()`). It lists tiles grouped by page in
display order, with ↑/↓ reorder, edit, delete and a duplicate note (same URL as a built-in or as another
custom tile), plus a *Backup* panel for export/import. `deleteCustomTile()` removes both the synced record
and its local icon. The page re-renders on `chrome.storage.onChanged`. Delete uses `window.confirm`.
Anything that needs room belongs here rather than in the 660 px popup.

## Runtime flow

`DOMContentLoaded` in [popup.js](../popup.js) calls, in order: `togglePages()`, `setupSearchFilter()`,
`renderFilteredPages()`, `focusSearchInput()`, `showAboutModal()`, `showSettingsModal()`,
`setupKeyboardShortcuts()`, `setupStatusBar()`, then `CustomTiles.loadCustomTiles().then(renderFilteredPages)`
so built-ins paint immediately and custom tiles appear a tick later. `chrome.storage.onChanged` re-runs the
same load + render whenever a `customTile:` key changes.

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
- Modals use `UI.createModalController()` ([ui.js](../ui.js)): focus trap on Tab, restore focus on close,
  backdrop click and `[data-close-modal]` close it, and a document-level Escape handler closes the
  top-most open `.modal-shell[data-open="true"]` (the controller is stashed on the element as
  `__closeModal`). The custom tile form uses the same helper.
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
`switchState` (Admin view on), `refreshState` (reload matched tab), `tabMode`, `theme`, `debugMode`, and
one `customTile:<id>` record per custom tile (see *Custom tiles*).

`localStorage` (same extension origin, synchronous): `theme` — mirror of the `theme` setting used only
by `theme-init.js` for the no-flash first paint.

`chrome.storage.local` (per-machine state / diagnostics):
`customTileIcon:<id>` (uploaded 50x50 PNG data URLs), `myTabId` (single-tab-mode tab id),
`alternativeURL` (last alternative pattern used for debugging),
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
- `changelog.json` is hand-maintained and its version heading (`2.2.0:` today) can drift from
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

There are no automated tests, linters, or build steps for the JavaScript. Validate with:

```bash
node --check popup.js && node --check custom-tiles.js && node --check options.js \
  && node --check ui.js && node --check builtin-tiles.js && node --check theme-init.js
python3 -m json.tool manifest.json >/dev/null && python3 -m json.tool changelog.json >/dev/null
npm run build:css && git diff --stat assets/tailwind.css
```

then load the folder via `chrome://extensions` → *Load unpacked* and exercise the popup and the options
page. Note that `popup.js` exits early outside an extension context (`chrome.runtime.getManifest()` at the
top level), so it cannot be smoke-tested by opening `popup.html` as a plain `file://` page.

A throwaway jsdom harness (stubbed `chrome.storage`/`chrome.tabs`, `JSDOM.fromFile` on `popup.html` and
`options.html`) is a practical way to test this end to end without Chrome — install jsdom with
`npm install --no-save jsdom` and `npm prune` afterwards so the lockfile stays clean. Remember to stub
callbacks as **async** (`setTimeout`) like the real extension APIs, otherwise ordering bugs appear that
Chrome never hits.
