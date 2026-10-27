/*
 * Copyright © 2026 Cloudrun Ltd
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Runs in <head> before first paint so the popup opens in the saved theme instead of flashing the
// default. popup.js mirrors the saved theme into localStorage (chrome.storage is async) and remains
// the source of truth for everything else.
(function () {
  const storedTheme = localStorage.getItem("theme");
  const theme = ["system", "light", "dark"].includes(storedTheme) ? storedTheme : "system";
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolvedTheme = theme === "system" ? (prefersDark ? "dark" : "light") : theme;

  document.documentElement.setAttribute("data-theme", resolvedTheme);
  document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
})();
