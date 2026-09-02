# LIFEHUB

LIFEHUB is a local-first personal command center for everything you want to do and everything you have done.

## Current Features

- Dashboard, Inbox, category views, Completed history, Statistics, and Settings
- Universal item capture with category-specific metadata
- IndexedDB persistence with backward-compatible record normalization
- Add, edit, complete, delete, global search, status filters, and safe external links
- Application and project deadline calculations with dashboard upcoming items
- JSON backup export/import and CSV export
- Dark, light, and system themes
- Skippable first-use onboarding
- Offline application shell through a service worker

## Technology

The project uses native HTML, CSS, and JavaScript ES modules. It has no framework, build step, backend, or external runtime dependency. User records stay in the browser's IndexedDB database named `lifehub`.

## Project Structure

- `index.html`: application shell and modal forms
- `css/style.css`: design tokens, layout, responsive styles, and themes
- `js/app.js`: boot process, application state, events, persistence workflows
- `js/database.js`: IndexedDB service
- `js/ui-complete.js`: current route renderer, filters, sorting, history, checklists, and dashboard preferences
- `js/utils.js`: normalization, validation, routes, and date helpers
- `manifest.webmanifest`: PWA metadata
- `service-worker.js`: cached application shell

## Run Locally

Serve the folder from an HTTP origin so ES modules, IndexedDB, and the service worker work correctly. For example:

```text
npx serve .
```

Then open the displayed local URL. Opening `index.html` directly supports basic rendering, but service-worker offline support requires HTTP or HTTPS.

## Backups

Use Settings > Export JSON to download a portable backup. Use Import JSON to validate and replace the current local dataset after confirmation. CSV export is intended for tabular item data and preserves commas, quotes, and line breaks safely.

## Privacy

LIFEHUB has no authentication or server. Data is stored locally in the browser profile. Clearing browser site data can remove records, so maintain JSON backups for important information.

## Development Notes

Keep the universal item shape stable and put category-specific fields under `metadata`. Normalize records at the database boundary when adding fields. Test changes in a fresh browser profile and at a 390px viewport.

## Roadmap

Automated browser tests, deeper category-specific edit history, and a gradual split of `ui-complete.js` into smaller page modules are planned for subsequent increments.
