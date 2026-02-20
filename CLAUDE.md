# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mothra Annotator is a browser-based image annotation tool for creating bounding box annotations on document images. It supports three annotation classes: text, music, and staves. Annotations can be exported in JSON or YOLO format. Deployed to GitHub Pages at `/mothra-annotator/`.

## Commands

- `npm run dev` — start Vite dev server with HMR
- `npm run build` — type-check with `tsc -b` then build with Vite
- `npm run lint` — ESLint across the project
- `npm run format` — format with Prettier
- `npm run format:check` — check formatting without writing
- `npm run deploy` — build and deploy to GitHub Pages via gh-pages

## Tech Stack

- React 19 + TypeScript, Vite 7, Tailwind CSS 4 (via `@tailwindcss/vite` plugin)
- State management: Zustand (single store at `src/store/useAppStore.ts`)
- No router, no backend — single-page client-only app

## Architecture

**State**: All app state lives in a single Zustand store (`useAppStore`). Components read from the store via hooks; canvas interaction code reads via `useAppStore.getState()` for performance (avoids re-renders during drag/draw).

**Canvas rendering**: The annotation canvas (`src/components/AnnotationCanvas.tsx`) uses a raw `<canvas>` element with 2D context, not React-managed DOM. Drawing is triggered via `requestAnimationFrame` and a manual `requestRedraw()` callback. The canvas handles DPR scaling for crisp rendering.

**Interaction model**: Mouse/pointer events are handled in `src/hooks/useCanvasInteraction.ts` using refs (not state) for in-flight drawing/dragging to avoid store churn. Drawing state and drag state are committed to the store only on pointer-up. Three edit modes: `idle`, `draw` (crosshair cursor, create boxes), `select` (move/resize existing boxes via 8-handle hit testing).

**Coordinate system**: Annotations store bounding boxes as `[x, y, w, h]` in image-pixel coordinates. The viewport transform (zoom + pan) converts between screen and image space via `src/lib/geometry.ts` helpers (`screenToImage`, `computeFitZoom`).

**Persistence**: Auto-saves to localStorage (debounced 500ms) keyed by image filename. Export supports JSON (full session) and YOLO (normalized center-format, 0-indexed class IDs). Import validates JSON structure.

**Annotation classes** are defined in `src/lib/constants.ts`: text (id=1), music (id=2), staves (id=3). Class IDs are 1-indexed in the app but converted to 0-indexed for YOLO export.

## Key Files

- `src/store/useAppStore.ts` — central state store with all actions
- `src/components/AnnotationCanvas.tsx` — canvas rendering loop
- `src/hooks/useCanvasInteraction.ts` — pointer/wheel event handling, drawing, drag/resize
- `src/hooks/useKeyboardShortcuts.ts` — keyboard shortcuts
- `src/lib/types.ts` — core type definitions
- `src/lib/constants.ts` — class definitions, zoom/size constants
- `src/lib/export.ts` — JSON/YOLO export and import
- `src/lib/storage.ts` — localStorage session persistence
