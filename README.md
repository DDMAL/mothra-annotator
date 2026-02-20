# Mothra Annotator

A browser-based image annotation tool for creating bounding box annotations on document images. Built for annotating text, music, and staves regions in scanned documents and sheet music.

**Live demo:** [https://ddmal.ca/mothra-annotator/](https://ddmal.ca/mothra-annotator/)

## Key Features

- **Bounding box annotation** — Draw, move, and resize bounding boxes directly on images
- **Three annotation classes** — Text, Music, and Staves, each with a distinct color and keyboard shortcut (`1`, `2`, `3`)
- **Draw and Select modes** — Switch between creating new boxes (`D`) and selecting/editing existing ones (`V`)
- **Resize handles** — 8-handle hit testing for precise box adjustments
- **Zoom and pan** — Scroll to pan, Shift+Scroll to zoom, or use `+`/`-` keys; press `0` to reset view
- **Class filter toggles** — Show or hide annotations by class
- **Label visibility toggle** — Press `L` to show/hide annotation labels
- **Undo support** — `Ctrl/Cmd+Z` to undo actions
- **Auto-save** — Annotations persist to localStorage automatically
- **Export formats** — Export as JSON (full session) or YOLO (normalized center-format with 0-indexed class IDs), with ZIP support for batch export
- **Import** — Load previously exported JSON annotations
- **Quick save** — `Ctrl/Cmd+S` to download annotations as JSON
- **Keyboard-driven workflow** — Shortcuts for class selection, mode switching, deletion (`Delete`/`Backspace`), and more

## Tech Stack

React 19, TypeScript, Vite 7, Tailwind CSS 4, Zustand

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Start Vite dev server with HMR           |
| `npm run build`      | Type-check and build for production      |
| `npm run lint`       | Run ESLint                               |
| `npm run format`     | Format with Prettier                     |
| `npm run deploy`     | Build and deploy to GitHub Pages         |
