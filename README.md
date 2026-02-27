# Social Media Stress Reliever (Firefox Extension)

This repository now contains a starter Firefox WebExtension that helps reduce social-media stress by:

- Hiding/dimming feed-like surfaces on supported social media sites.
- Sending mindful break reminders at a configurable interval.
- Allowing quick toggles from a popup UI.

## Project structure

- `manifest.json` – extension manifest and permissions.
- `background.js` – settings defaults, alarms, notifications, and message handling.
- `content/content.js` – feed dimming behavior injected into matched websites.
- `popup/popup.html` – popup UI.
- `popup/popup.css` – popup styling.
- `popup/popup.js` – popup behavior and settings updates.

## Run locally in Firefox

1. Open Firefox.
2. Navigate to `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on...**.
4. Select this folder's `manifest.json`.

## Notes

- This is a starter implementation: selectors and behavioral heuristics can be tuned by platform.
- Notifications require Firefox permissions to be granted for the browser.
