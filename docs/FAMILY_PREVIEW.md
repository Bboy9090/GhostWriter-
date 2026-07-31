# GhostWriter 1.1 Family Preview

GhostWriter 1.1 is a local-first writing studio intended for supervised friends-and-family testing.

## Included

- blank, email, essay, script, blog, and chapter templates
- automatic local saving
- project search and deletion
- full JSON backup and restore
- Markdown and plain-text export
- dark and light themes
- installable offline-capable PWA shell
- first-run privacy and limitations notice

## Honest limitations

- Projects are stored in the current browser. Clearing browser data can erase them.
- Backups must be downloaded manually and restored manually on another device.
- Cloud sync, collaboration, AI writing, PDF/DOCX export, desktop installers, and app-store distribution are not included.
- Offline support begins after a successful online production load and service-worker installation.
- This is a prerelease for feedback, not a production or store release.

## Tester checklist

1. Install or open the hosted PWA.
2. Create one project from a template and one blank project.
3. Close and reopen the app; confirm both projects remain.
4. Export Markdown and plain text.
5. Download a JSON backup.
6. Restore the backup in another browser profile if available.
7. Report the browser, device, action, expected result, and observed result for any failure.

## Release gate

The preview may be tagged only when dependency installation, type checking, lint, unit tests, production build, and the Chromium smoke test pass on the same commit.
