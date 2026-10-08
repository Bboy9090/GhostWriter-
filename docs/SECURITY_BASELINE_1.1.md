# GhostWriter 1.1 Security Baseline

## Release result

The friends-and-family PWA has zero known npm production-runtime vulnerabilities at the audited lockfile.

```text
npm audit --omit=dev
found 0 vulnerabilities
```

This command is enforced in pull-request CI.

All third-party and GitHub-maintained workflow actions are pinned to full 40-character commit SHAs. This satisfies the repository's `sha_pinning_required` policy and prevents mutable action tags from changing the code executed by CI.

## Dependency cleanup

The release removed abandoned dependencies from the earlier screen-capture, OCR, Spark, server, analytics, and desktop experiments. The active runtime is intentionally limited to React, the small UI helpers used by the writer, and Sonner notifications.

Build, lint, test, browser-automation, and TypeScript packages remain development-only and are not included in the static production bundle.

## Residual risk

- Development tooling still reports upstream advisories through Vite, Vitest, jsdom, and their transitive packages.
- Those tools run only during local development and CI; they are not browser runtime dependencies.
- Developers must not expose the Vite development server to untrusted networks.
- The lockfile must be re-audited before every prerelease or release.
- A zero npm audit count is not a complete application security review.
