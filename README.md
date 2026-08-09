# AI Finder

A searchable, filterable catalog of AI tools — writing, image, video, audio, code, 3D, music, avatars, research, and more.

## Features

- **Search & filter** by keyword, category, or feature tag (API, free trial, offline, etc.)
- **Quick-start shortcuts** for common tasks ("Write content", "Edit video", "Automate tasks"…)
- **Grid and table views**, sortable by name, rating, or price
- **Favorites**, saved locally in your browser
- **Light/dark theme**, defaulting to dark
- **Multi-language UI** (English, Turkish, Spanish, German, French), auto-detected from your browser
- **Submit a tool** and **Get Featured** request forms

## Running locally

This is a single self-contained `index.html` file with no build step or dependencies. Open it directly in a browser, or serve the folder with any static file server, e.g.:

```
python3 -m http.server 8000
```

## Adding a tool

Add an entry to the `TOOLS` array in `index.html` with an `id`, `name`, `cat` (category), `desc`, `rating`, `url`, `price` (`Free` / `Freemium` / `Paid`), and `features` (any of `api`, `freeTrial`, `noLogin`, `teamCollab`, `mobileApp`, `browserExt`, `offline`, `enterprise`). New categories pick up a color automatically if added to `CAT_COLORS`.
