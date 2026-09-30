# Swimlane Studio

Turns a plain-language description of a business or industrial process into an editable swimlane diagram.

```
Description → AI (structured JSON) → validate + sanitize → layout → editable canvas → save / export
```

The structured process model (`ProcessModel` in `src/shared/schema.ts`) is the source of truth. The canvas is rendered from it and every edit writes back to it, so diagrams can be saved, reloaded, re-laid-out and exported without losing meaning.

## Run locally

```bash
cd swimlane
npm install
cp .env.example .env     # optional: add ANTHROPIC_API_KEY
npm run dev              # web on http://localhost:5173, API on :8787
```

Click **Use example**, then **Generate swimlane**.

Without `ANTHROPIC_API_KEY` the server uses a rule-based offline parser so the app still works end to end; the UI says when that happened. With a key, generation uses Claude (`claude-opus-5-5`, overridable with `ANTHROPIC_MODEL`) with structured outputs. The key is only read on the server.

Other scripts: `npm test` (Vitest), `npm run typecheck`, `npm run build` then `npm start` (serves the built app and API on one port).

## What works

- Generate from text, with staged progress, cancel, and readable errors (empty/too long input, AI failure, invalid AI output, network).
- AI output is schema-validated, sanitized (markup stripped, labels clamped), de-duplicated, broken references removed, missing lanes added, empty lanes dropped. Corrections are reported back.
- Lane-aware auto layout (process order left to right, departments top to bottom, no overlaps) and an **Auto layout** button.
- Editing: drag nodes between departments, multi-select (Shift+click or Shift+drag), inline label editing (double-click), connect by dragging from a node's edge dot, reconnect arrow ends, Yes/No labels, colors, size, font size, add/rename/recolor/reorder/delete departments, add Activity/Decision/Start/End/Document, duplicate, copy/paste, delete, align and distribute.
- Undo/redo for every model change (Ctrl+Z / Ctrl+Shift+Z), zoom, pan, fit, minimap.
- Save to this browser (Ctrl+S) and restore on reload.
- Export PNG of the full diagram at 2x resolution.
- Process summary panel: departments, activities, decisions, inputs, outputs, assumptions. Ambiguous steps are shown dashed with a "?" badge.

## Not built yet

PDF and Word export, server-side persistence with accounts, AI improve/simplify/explain actions on an existing diagram, a settings screen.

## Layout

```
server/            Hono API: /api/generate, Claude call, offline parser
src/shared/        schema (zod), sanitize/normalize, layout engine — used by server and client
src/store.ts       zustand store: model, selection, undo/redo history, save/restore
src/components/    Header, Sidebar, GeneratorPanel, Canvas (React Flow), LanesLayer, PropertiesPanel, nodes/
src/lib/           API client, PNG export
tests/             pipeline and API tests
```
