# Capture → vault: audit, plan, and supported flows

This document reflects how GhostWriter actually behaves after the capture-to-vault pass (April 2026). Use it to align expectations for desktop web, extension, iOS lab, and the Go API.

## Audit summary

| Area                      | Finding                                                                                                                                                                                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **OCR**                   | Web screenshot dropzone runs **Tesseract.js** in-browser with shared preprocessing (`src/lib/ocr-browser.ts`). Heavy video stitching stays in **Dev → iOS Upload** (`IOSCapture.tsx`).                                                                    |
| **Ingestion UX**          | Previously, dropping a file only logged a placeholder string; now **images** are OCR’d into the local vault. **Videos** are routed to the iOS Upload lab with an explicit toast.                                                                          |
| **Stitching / dedup**     | `capture-filters.ts` dedup now **normalizes whitespace** before Jaccard compare, reducing false negatives on wrapped OCR. iOS lab keeps paragraph-level dedup.                                                                                            |
| **Sync**                  | **Local vault** = `localStorage` + `BroadcastChannel` (`capture-store.ts`). **Server vault** = WebSocket `/ws` + Postgres or Mongo + Redis (`backend-go`). They are separate paths until a client wires them together.                                    |
| **Search**                | Local feed = substring on content/source/tags. **Optional cloud panel** when `VITE_API_URL` (or `VITE_GHOSTWRITER_API_URL`) + `VITE_GHOSTWRITER_USER_ID` are set. Server `/vault/search` = **vector + keyword hybrid** with fallback if embeddings fail.  |
| **Backend queue / retry** | WebSocket ingest now **retries** embedding generation and DB insert with backoff. Mongo search still loads user rows for vector scoring (scale consideration for very large vaults).                                                                      |
| **Mobile vs desktop**     | **Desktop main page**: screenshot OCR + manual paste + demo stream + optional cloud search. **Mobile**: same web app; use **iOS Upload** in the dev drawer for batch images/video frames. **Extension** = side panel capture (see `extension/README.md`). |

## Prioritized implementation plan (completed in this pass)

1. **Capture / upload** — Real OCR on image drop; clear video vs image routing; label demo capture honestly.
2. **OCR / stitching** — Shared `ocr-browser` module; whitespace-normalized dedup in filters.
3. **Vault search UX** — Cloud results panel + env-based configuration; hybrid API search.
4. **Sync / reliability** — WS retries; Spark KV retry in `offline-sync.ts`.

## Supported flows (checklist)

- [x] Paste or type into the vault quick-add field → local vault (`Manual`).
- [x] Drop **screenshot image** → Tesseract → local vault (`Screenshot`).
- [x] Drop **video** → toast directs to **Dev → iOS Upload**.
- [x] **Always-On** toggle → demo sample lines only (not OS screen capture in the browser).
- [x] **Capture Filters** panel → noise, sensitive, min length, dedup before store.
- [x] **Export** JSON/text from the storage bar.
- [x] **Optional** semantic search against Go API when env vars are set.
- [x] **WebSocket** text ingest to server vault when a client posts to `/ws` (see `backend-go/README.md`).

## Environment reference

| Variable                   | Purpose                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------ |
| `VITE_API_URL`             | Base URL for `/vault/search` (optional cloud panel).                                                   |
| `VITE_GHOSTWRITER_API_URL` | Overrides API base if you need a different host than `VITE_API_URL`.                                   |
| `VITE_GHOSTWRITER_USER_ID` | UUID string required for `/vault/search` body.                                                         |
| `VITE_WS_URL`              | Documented for clients that push text over WebSocket (not used automatically by the vault feed today). |

## Phase map (code)

| Phase | Files / areas                                                                                                                    |
| ----- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `src/App.tsx` (dropzone, demo label), `src/lib/ocr-browser.ts`                                                                   |
| 2     | `src/components/IOSCapture.tsx` (import shared OCR), `src/lib/capture-filters.ts`                                                |
| 3     | `src/lib/vault-api.ts`, `src/App.tsx` (cloud panel), `backend-go/internal/handlers/rest.go`, `hybrid_search.go`, `database/*.go` |
| 4     | `backend-go/internal/handlers/websocket.go`, `src/lib/offline-sync.ts`                                                           |
