# The 25 Cryptids of Christmas

A static, illustrated advent calendar and collectible field guide for the 2026 Christmas season. One local-calendar day unlocks at a time from December 1–25, and discoveries are saved only in the visitor's browser.

## Local development

This project uses Vite+.

```sh
vp install
vp dev
```

Vite serves the app beneath its production base path at `http://localhost:5173/christmas/`.

For pre-season testing, add a development-only local date override:

```text
http://localhost:5173/christmas/?date=2026-12-05
```

The override is guarded by `import.meta.env.DEV` and is ignored by production builds. A full local date/time value can also be supplied when testing countdown transitions.

## Validate and build

```sh
vp check
vp test
vp run build
```

The production site is written to `dist/`. No backend, environment variables, third-party scripts, analytics, or service worker are required.

## GitHub Pages

In the repository's **Settings → Pages**, select **GitHub Actions** as the publishing source. The workflow checks, tests, and builds pull requests targeting `main`. Pushes to `main` and manual runs on `main` also publish `dist/`.

The Vite base is `/christmas/`. The default project URL is `https://snally-dev.github.io/christmas/`. For `https://snally.com/christmas/`, the project can inherit `snally.com` from the owner's GitHub Pages site.

## Project structure

- `src/config.ts` — season, storage key, asset paths, and dev-only date override
- `src/dates.ts` — local-date unlocking and countdown logic
- `src/storage.ts` — versioned persistence, validation, merge restore, and memory fallback
- `src/main.ts` — accessible rendering, routing, dialogs, collection, and settings
- `src/style.css` — responsive field-guide presentation and reduced-motion behavior
- `public/assets/Christmas-Cryptids-2026/` — the authoritative JSON dataset and all 25 transparent PNG illustrations

Progress uses the localStorage key `snally.christmas.2026.v1`. Exported progress is plain JSON; restores validate the season and version, ignore invalid creature IDs, and merge discoveries without deleting existing ones.

## iPad home screen

In Safari, open the deployed URL and choose **Share → Add to Home Screen**. The manifest, theme color, app title, and touch icon all resolve beneath `/christmas/`.

The responsive layout is tuned for both 11-inch and 13-inch iPad Pro viewports: landscape uses a five-column calendar, portrait uses four columns, and touch controls are at least 48 CSS pixels in the iPad layouts.
