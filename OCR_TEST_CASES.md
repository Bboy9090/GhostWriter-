# GhostWriter OCR Engine - Initial Test Cases

Purpose: Validate that on-device OCR captures paragraphs accurately while
scrolling, deduplicates repeated frames, and preserves layout semantics.

Scope: OCR + dedup gate + healer handoff. Excludes any protected/secure
content (FLAG_SECURE) and bypass tooling.

Test Data
- Synthetic screenshots (licensed docs, public domain text).
- Mixed typography (headings, body, captions, code blocks).
- Paragraph sets with known ground truth.
- Multi-column layouts and tables.

Environments
- Android 14/15 reference devices.
- 3 capture modes: Quality (3 FPS), Balanced (5 FPS), Turbo (10 FPS).
- Portrait + landscape orientation.

Metrics
- Word accuracy >= 95 percent.
- Paragraph integrity: no dropped sentences, no merged paragraphs.
- Dedup hit rate >= 85 percent during slow scroll.
- OCR p95 latency <= 100ms on-device.

Automation Harness
- Test definitions live in tests/ocr/cases.json.
- Fixtures are in tests/ocr/fixtures and expected output in tests/ocr/expected.
- Run the harness with:
  node scripts/ocr-harness.mjs --adapter mock
- Use a real adapter with:
  node scripts/ocr-harness.mjs --adapter <name>

Test Cases

OCR-001: Single paragraph capture
Steps:
1) Open a static doc with one paragraph.
2) Start portal; keep screen still for 5 seconds.
Expected:
- OCR returns a single paragraph identical to ground truth.
- No duplicates after initial capture.

OCR-002: Multi-paragraph block preservation
Steps:
1) Open a doc with 3 paragraphs separated by blank lines.
2) Capture one frame.
Expected:
- OCR output contains 3 distinct paragraphs with preserved breaks.

OCR-003: Multi-block layout order (title + body + caption)
Steps:
1) Open a page with a title, body, and image caption.
2) Capture one frame.
Expected:
- Output order is title, body, caption.
- Caption not merged into body text.

OCR-004: Multi-column layout
Steps:
1) Open a two-column PDF.
2) Capture frame at mid-page.
Expected:
- Paragraphs ordered top-to-bottom, left column then right column.
- No cross-column sentence merging.

OCR-005: Table extraction
Steps:
1) Open a table with 3 columns x 5 rows.
2) Capture frame.
Expected:
- Rows retained with column order.
- No row duplication or column collapse.

OCR-006: Code block preservation
Steps:
1) Open a page with a monospace code block.
2) Capture frame.
Expected:
- Code block retained as a separate paragraph.
- Indentation preserved.

OCR-007: Mixed fonts and sizes
Steps:
1) Open a page with headings (H1, H2) and body text.
2) Capture frame.
Expected:
- Headings not merged into body paragraphs.
- Body text uninterrupted.

OCR-008: Low-contrast text
Steps:
1) Use light gray text on white background.
2) Capture frame.
Expected:
- OCR still hits >= 90 percent word accuracy.
- Confidence score reflects lower contrast.

OCR-009: Dark mode inversion
Steps:
1) Open app in dark mode (light text on dark background).
2) Capture frame.
Expected:
- Accuracy matches light mode within 2 percent.

OCR-010: Small font size
Steps:
1) Open a paragraph at 10-12pt font size.
2) Capture frame.
Expected:
- Accuracy >= 92 percent.
- No paragraph breaks introduced.

OCR-011: Large font size
Steps:
1) Open a paragraph at 20-24pt font size.
2) Capture frame.
Expected:
- Accuracy >= 95 percent.

OCR-012: Scroll slow with overlap
Steps:
1) Scroll down slowly through a page.
2) Capture for 10 seconds at 5 FPS.
Expected:
- Dedup gate removes repeated paragraphs.
- New text appended in order.

OCR-013: Scroll fast with gaps
Steps:
1) Scroll down quickly for 5 seconds.
2) Stop, then scroll back a small amount.
Expected:
- Missing paragraphs flagged in logs.
- No duplicated paragraphs on return scroll.

OCR-014: Partial paragraph re-entry
Steps:
1) Scroll so only the last 2 lines of a paragraph remain visible.
2) Capture frame.
Expected:
- Dedup gate prevents a partial paragraph from overwriting the full one.

OCR-015: Orientation change mid-session
Steps:
1) Start capture in portrait.
2) Rotate to landscape and continue capture.
Expected:
- Capture resumes without crash.
- No content duplication at rotation boundary.

OCR-016: App switch tagging
Steps:
1) Capture in App A.
2) Switch to App B and continue capture.
Expected:
- Source app metadata reflects correct app for each entry.

OCR-017: Healer pass output
Steps:
1) Capture OCR output with broken lines.
2) Trigger healer batch.
Expected:
- Healed text merges lines into clean paragraphs.
- No hallucinated content.

OCR-018: Healer disabled
Steps:
1) Disable healer toggle.
2) Capture same content as OCR-017.
Expected:
- Raw OCR stored; no formatting changes applied.

OCR-019: Language pack (English + Spanish)
Steps:
1) Open bilingual text block.
2) Capture frame.
Expected:
- Both languages recognized correctly.
- Language mixing does not drop accents.

OCR-020: Emoji and symbols
Steps:
1) Open text with punctuation, bullets, and emoji.
2) Capture frame.
Expected:
- Symbols preserved or gracefully normalized.

OCR-021: Memory stability
Steps:
1) Run capture for 30 minutes at 5 FPS.
Expected:
- No memory growth beyond baseline.
- No frame drops > 5 percent.

OCR-022: Offline queueing
Steps:
1) Disable network.
2) Capture for 5 minutes.
3) Re-enable network.
Expected:
- Entries queue locally and sync on reconnection.

OCR-023: Permission revoked mid-session
Steps:
1) Start capture.
2) Revoke MediaProjection permission.
Expected:
- Capture stops gracefully with user prompt.
- No crashes.

OCR-024: Overlay permission missing
Steps:
1) Remove overlay permission.
2) Attempt to start capture.
Expected:
- User is routed to settings.
- No capture begins until permission granted.

OCR-025: Zero content frame
Steps:
1) Capture a screen with no text (image only).
Expected:
- Empty result discarded.
- No vault entry created.

Acceptance Checklist
- All OCR-001 through OCR-025 pass on two devices.
- Paragraph integrity issues are tracked and fixed before release.

