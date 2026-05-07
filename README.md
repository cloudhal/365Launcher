# 365 Launcher X

A lightweight, compact, launcher for Microsoft 365 apps and admin portals. Features different tab modes to minimise open tabs.

## Features

- 🧇 **Quick Access**: Access Microsoft 365 apps and admin portals directly from a single launcher.
- 🌐 **Tab mode**: Minimises the number of open by finding existing open tabs, choose between three tab modes.
- 🎨 **Customizable**: Toggle between Apps and Admin panels. Suggested to use a different browser profile for admin accounts.
- 🌗 **Dark Mode**: Adapts to the browser's dark mode setting.
- 📁 **Compact Design**: A responsive grid interface tailored for seamless user experience.
- 🔒 **Secure**: Settings are synced and stored securely using `chrome.storage`.

## Installation

- Install from the Chrome or Edge stores.

## Usage

- Click on the 365 Launcher X icon in the Chrome toolbar.
- Use the **Apps/Admin** toggle to switch between app shortcuts and admin portals.
- The launcher is responsive and adapts to your current browser theme (light or dark mode).

## Available Shortcuts

### **Apps**
- **OneDrive**
- **Teams**
- **Power BI**
- ...and more!

### **Admin**
- **365 Admin**
- **Entra ID Admin**
- **Azure Portal**
- ...and more!

## Customization

All settings are saved using the Chrome `storage.sync` API, allowing users to retain their preferred configurations even after closing the browser.

## Development

If you'd like to contribute or make improvements:
1. Fork the repository.
2. Make your changes in a new branch:
   ```bash
   git checkout -b feature/my-new-feature
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add my new feature"
   ```
4. Push to the branch:
   ```bash
   git push origin feature/my-new-feature
   ```
5. Create a pull request.

For local UI work, install the dev dependency once with `npm install` and rebuild the popup stylesheet with `npm run build:css` after editing [styles/tailwind.css](styles/tailwind.css) or the popup markup.

## License

Copyright © 2026 Cloudrun Ltd

This project is licensed under the Mozilla Public License (MPL), v. 2.0

## Acknowledgments

None.
