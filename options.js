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

function buildRow(tile) {
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

  row.append(image, details, editButton, deleteButton);

  return row;
}

function renderList() {
  const list = document.getElementById("tile-list");
  const summary = document.getElementById("tile-summary");
  const emptyState = document.getElementById("empty-state");
  const tiles = CustomTiles.getCustomTiles().sort((a, b) => a.text.localeCompare(b.text));

  list.innerHTML = "";
  emptyState.classList.toggle("hidden", tiles.length > 0);
  summary.textContent = tiles.length === 0
    ? ""
    : `${tiles.length} custom ${tiles.length === 1 ? "tile" : "tiles"}`;

  const fragment = document.createDocumentFragment();
  tiles.forEach(tile => fragment.appendChild(buildRow(tile)));
  list.appendChild(fragment);
}

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
