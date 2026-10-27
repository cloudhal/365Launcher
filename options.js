/*
 * Copyright © 2026 Cloudrun Ltd
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const PAGE_LABELS = { apps: "Apps", admin: "Admin" };
const MATCH_LABELS = {
  site: "Any page on this site",
  exact: "This exact page",
  pattern: "Custom pattern"
};

// Custom tiles render first in the popup grid, grouped by page and then by the saved order.
function orderedTiles() {
  return ["apps", "admin"].flatMap(page => CustomTiles.getCustomTiles(page).sort(CustomTiles.compareTiles));
}

function noteDuplicates() {
  const builtinLinks = new Set(
    typeof getBuiltinIcons === "function" ? getBuiltinIcons().map(icon => icon.link) : []
  );
  const counts = new Map();

  CustomTiles.getCustomTiles().forEach(tile => {
    counts.set(tile.link, (counts.get(tile.link) || 0) + 1);
  });

  return tile => {
    const notes = [];

    if (builtinLinks.has(tile.link)) {
      notes.push("Also opened by a built-in tile");
    }

    if ((counts.get(tile.link) || 0) > 1) {
      notes.push("Shared with another custom tile");
    }

    return notes;
  };
}

function reorderButtons(tile, position, pageCount) {
  const container = document.createElement("div");
  container.className = "flex shrink-0 flex-col gap-1";

  const make = (symbol, direction, label, disabled) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "panel-button-secondary h-6 w-6 px-0 py-0 text-xs leading-none";
    button.textContent = symbol;
    button.title = label;
    button.setAttribute("aria-label", `${label}: ${tile.text}`);
    button.disabled = disabled;
    button.addEventListener("click", async () => {
      if (await CustomTiles.moveCustomTile(tile.id, direction)) {
        renderList();
      }
    });
    return button;
  };

  container.append(
    make("↑", "up", "Move up", position === 0),
    make("↓", "down", "Move down", position === pageCount - 1)
  );

  return container;
}

function buildRow(tile, position, pageCount, notes) {
  const row = document.createElement("li");
  row.className = "flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-700 dark:bg-slate-900";

  const image = document.createElement("img");
  image.src = CustomTiles.resolveIconSrc(tile);
  image.alt = "";
  image.className = "h-9 w-9 shrink-0";

  const details = document.createElement("div");
  details.className = "min-w-0 flex-1";

  const title = document.createElement("p");
  title.className = "truncate text-sm font-medium text-slate-800 dark:text-slate-100";
  title.textContent = tile.text;

  const link = document.createElement("p");
  link.className = "truncate text-xs text-slate-500 dark:text-slate-400";
  link.textContent = tile.link;

  const meta = document.createElement("p");
  meta.className = "mt-0.5 text-xs text-slate-400 dark:text-slate-500";
  meta.textContent = `${PAGE_LABELS[tile.page]} · ${MATCH_LABELS[tile.matchMode] || MATCH_LABELS.pattern}`;

  details.append(title, link, meta);

  if (notes.length > 0) {
    const warning = document.createElement("p");
    warning.className = "mt-1 inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-100";
    warning.textContent = notes.join(" · ");
    details.appendChild(warning);
  }

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "panel-button-secondary";
  editButton.textContent = "Edit";
  editButton.addEventListener("click", () => {
    CustomTiles.openTileForm({ tile, onSaved: renderList });
  });

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "panel-button-secondary";
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", async () => {
    if (!window.confirm(`Delete "${tile.text}"?`)) {
      return;
    }

    await CustomTiles.deleteCustomTile(tile.id);
    renderList();
  });

  row.append(reorderButtons(tile, position, pageCount), image, details, editButton, deleteButton);

  return row;
}

function renderList() {
  const list = document.getElementById("tile-list");
  const summary = document.getElementById("tile-summary");
  const emptyState = document.getElementById("empty-state");
  const tiles = orderedTiles();

  list.innerHTML = "";
  emptyState.classList.toggle("hidden", tiles.length > 0);
  summary.textContent = tiles.length === 0
    ? ""
    : `${tiles.length} custom ${tiles.length === 1 ? "tile" : "tiles"}`;

  const notesFor = noteDuplicates();
  const fragment = document.createDocumentFragment();

  tiles.forEach(tile => {
    const pageTiles = CustomTiles.getCustomTiles(tile.page).sort(CustomTiles.compareTiles);
    const position = pageTiles.findIndex(candidate => candidate.id === tile.id);

    fragment.appendChild(buildRow(tile, position, pageTiles.length, notesFor(tile)));
  });

  list.appendChild(fragment);
}

function showBackupStatus(message, isError = false) {
  const status = document.getElementById("backup-status");

  status.textContent = message;
  status.className = isError
    ? "mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200"
    : "mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100";
}

function describeImport(result) {
  if (!result.ok) {
    return result.errors.join(" ");
  }

  const parts = [`Imported ${result.imported} ${result.imported === 1 ? "tile" : "tiles"}`];

  if (result.skipped > 0) {
    parts.push(`skipped ${result.skipped}`);
  }

  const summary = `${parts.join(", ")}.`;

  return result.errors.length > 0 ? `${summary} ${result.errors.join(" ")}` : summary;
}

function downloadExport() {
  const payload = CustomTiles.exportTiles();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `365-launcher-tiles-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  showBackupStatus(`Exported ${payload.tiles.length} ${payload.tiles.length === 1 ? "tile" : "tiles"}.`);
}

async function handleImportFile() {
  const input = document.getElementById("import-file");
  const file = input.files && input.files[0];

  if (!file) return;

  try {
    const result = await CustomTiles.importTiles(await file.text());

    renderList();
    showBackupStatus(describeImport(result), !result.ok);
  } catch (error) {
    console.error("Importing custom tiles failed", error);
    showBackupStatus("That file could not be read.", true);
  }
}

document.getElementById("export-tiles").addEventListener("click", downloadExport);

document.getElementById("import-tiles").addEventListener("click", () => {
  const input = document.getElementById("import-file");

  input.value = ""; // Allow re-selecting the same file
  input.click();
});

document.getElementById("import-file").addEventListener("change", handleImportFile);

function refresh() {
  CustomTiles.loadCustomTiles()
    .then(renderList)
    .catch(error => console.error("Loading custom tiles failed", error));
}

document.getElementById("add-tile").addEventListener("click", () => {
  CustomTiles.openTileForm({ page: "apps", onSaved: renderList });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && Object.keys(changes).some(CustomTiles.isTileKey)) {
    refresh();
  }
});

refresh();
