/*
 * Copyright © 2026 Cloudrun Ltd
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Built-in tiles shared by the popup and the options page (Custom tiles uses them for icon choices).

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
// Patterns are plain URLs with '*' wildcards; '.' and '?' always match literally, while character
// classes such as [^.-] are passed through as regex. To test one in a regex tester, replace * with .*
// e.g. https:\/\/[^.-]+\.sharepoint\.com\/.*
// Any time you want to match using a * wildcard, set the type to 'pattern'
// For icons, if no border is present, resize image to 44px using Photoshop or Photopea, then resize the canvas to 50 px to add some space
const appIcons = [
  new IconItem("icons/Bookings_50x50.png", "https://outlook.office.com/bookings/", "Bookings", "startsWith"),
  new IconItem("icons/Excel_50x50.png", "https://m365.cloud.microsoft/launch/excel/", "Excel", "startsWith"),
  new IconItem("icons/Copilot_50x50.png", "https://m365.cloud.microsoft/chat", "Copilot", "pattern", ["https://copilot.cloud.microsoft/*","https://m365.cloud.microsoft/chat*"]),
  new IconItem("icons/Fabric_50x50.png", "https://app.fabric.microsoft.com/", "Fabric", "startsWith"),
  new IconItem("icons/Forms_50x50.png", "https://forms.office.com/", "Forms", "startsWith"),
  new IconItem("icons/Lists_50x50.png", "https://m365.cloud.microsoft/launch/lists/", "Lists", "pattern", ["https://*-my.sharepoint.com/personal/*/Lists.aspx?*","https://*.sharepoint.com/sites/*/Lists/*"]),
  new IconItem("icons/Microsoft_Teams_50x50.png", "https://teams.cloud.microsoft/", "Teams", "startsWith"),
  new IconItem("icons/Microsoft365_50x50.png", "https://m365.cloud.microsoft/?auth=2", "Office", "exact"),
  new IconItem("icons/OneDrive_50x50.png", "https://m365.cloud.microsoft/launch/onedrive/", "OneDrive", "pattern", ["https://*-my.sharepoint.com/?*","https://*-my.sharepoint.com/shared?*","https://*-my.sharepoint.com/my?*"]),
  new IconItem("icons/OneNote_50x50.png", "https://m365.cloud.microsoft/launch/onenote/", "OneNote", "startsWith"),
  new IconItem("icons/Outlook_50x50.png", "https://outlook.cloud.microsoft/mail", "Outlook", "startsWith"),
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
  new IconItem("icons/Clipchamp_50x50.png", "https://www.office.com/launch/clipchamp?auth=2/", "Clipchamp", "pattern", ["https:\/\/[^.-]+.sharepoint.com\/[^.-]+\/videohub.aspx", "https:\/\/[^.-]+.sharepoint.com\/[^.-]+\/videoeditor.aspx"]), // match clipchamp launch page or video hub in sharepoint
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
    new IconItem("icons/Fabric_50x50.png", "https://app.fabric.microsoft.com/admin-portal/", "Fabric", "startsWith"),
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

// Every built-in tile, used for icon choices and duplicate checks in the custom tile editor.
function getBuiltinIcons() {
  return [...appIcons, ...adminIcons];
}
