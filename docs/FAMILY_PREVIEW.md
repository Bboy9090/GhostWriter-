# GhostWriter 1.1 Family Preview

GhostWriter 1.1 is a local-first writing studio intended for supervised friends-and-family testing.

## Included

- blank, email, essay, script, blog, and chapter templates
- automatic local saving
- project search and deletion
- full JSON backup and restore
- Word (.docx), Markdown and plain-text export
- dark and light themes
- installable offline-capable PWA shell
- first-run privacy and limitations notice

## Honest limitations

- Projects are stored in the current browser. Clearing browser data can erase them.
- Backups must be downloaded manually and restored manually on another device.
- Cloud sync, collaboration, AI writing, PDF export, desktop installers, and app-store distribution are not included.
- Offline support begins after a successful online production load and service-worker installation.
- This is a prerelease for feedback, not a production or store release.

## Tester checklist

1. Install or open the hosted PWA.
2. Create one project from a template and one blank project.
3. Close and reopen the app; confirm both projects remain.
4. Export Word (.docx), Markdown and plain text.
5. Download a JSON backup.
6. Restore the backup in another browser profile if available.
7. Report the browser, device, action, expected result, and observed result for any failure.

## Release gate

The preview may be tagged only when dependency installation, type checking, lint, unit tests, production build, and the Chromium smoke test pass on the same commit.

The same commit must also pass `npm audit --omit=dev` with zero known production-runtime vulnerabilities. See [`SECURITY_BASELINE_1.1.md`](SECURITY_BASELINE_1.1.md).

### Word export

Use **Word (.docx)** in an open project to download the current editor snapshot without sending writing to a server. It preserves literal text, Unicode, tabs and blank lines; Markdown syntax is not converted into rich formatting. The exporter must load once online before it can be reused from the offline cache. If Word cannot represent a pasted character or generation fails, the draft stays open and Markdown/Text remain available. This is document export, not a typeset print interior or publication certification.
