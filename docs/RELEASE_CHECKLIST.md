# Ghost Writer - Release Checklist

Use this checklist before releasing a new version of Ghost Writer to ensure quality and completeness.

## Pre-Release Preparation

### 1. Code Quality
- [ ] All tests pass (`npm test`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code formatting is consistent (`npm run format:check`)
- [ ] No console.log statements in production code
- [ ] No commented-out code blocks
- [ ] All TODO comments addressed or tracked

### 2. Features & Functionality
- [ ] All planned features implemented and tested
- [ ] Writing editor works properly
- [ ] All templates render correctly
- [ ] AI provider configuration works (or degrades gracefully)
- [ ] Export functionality works for all formats (markdown, txt)
- [ ] Local storage saves and loads projects correctly
- [ ] Auto-save functionality works
- [ ] Dark mode and light mode both work
- [ ] All UI components render correctly

### 3. Browser & Device Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome (responsive)
- [ ] Mobile Safari (responsive)
- [ ] Tablet view (iPad size)
- [ ] Desktop view (1920x1080)

### 4. Performance
- [ ] App loads in < 1 second (development build)
- [ ] Production build is optimized (`npm run build`)
- [ ] Bundle size is reasonable (< 500KB gzipped)
- [ ] No performance warnings in browser console
- [ ] Lighthouse score > 90 for Performance
- [ ] Lighthouse score > 90 for Accessibility
- [ ] Auto-save doesn't cause UI lag

### 5. Accessibility
- [ ] Keyboard navigation works throughout app
- [ ] Focus indicators are visible
- [ ] Screen reader compatibility tested
- [ ] Color contrast meets WCAG AA standards
- [ ] All images have alt text
- [ ] Form inputs have proper labels
- [ ] Error messages are descriptive

### 6. Documentation
- [ ] README.md is up to date
- [ ] docs/PRD.md reflects current features
- [ ] docs/ROADMAP.md is current
- [ ] docs/WRITING_PIPELINE.md is accurate
- [ ] All code changes have inline comments where needed
- [ ] API documentation is updated (if applicable)
- [ ] CHANGELOG.md is updated with release notes

### 7. Scripts & Health Checks
- [ ] `scripts/healthcheck.sh` passes
- [ ] `scripts/smoke-test.sh` passes
- [ ] All npm scripts work correctly
- [ ] Build script produces valid output
- [ ] Health check validates editor, templates, export, config, storage

## Release Process

### 1. Version Bump
- [ ] Update version in `package.json`
- [ ] Update version in `app.metadata.json`
- [ ] Update "Last Updated" in docs/ROADMAP.md
- [ ] Create CHANGELOG entry for this version

### 2. Build & Test
- [ ] Clean install dependencies (`rm -rf node_modules package-lock.json && npm install`)
- [ ] Run full test suite (`npm run check-all`)
- [ ] Build production bundle (`npm run build`)
- [ ] Test production build locally (`npm run preview`)
- [ ] Run health check on production build

### 3. Commit & Tag
- [ ] All changes committed
- [ ] Commit message follows convention
- [ ] Create git tag (`git tag -a v1.0.0 -m "Release v1.0.0"`)
- [ ] Push commits (`git push`)
- [ ] Push tags (`git push --tags`)

### 4. Deployment
- [ ] Deploy to staging environment (if available)
- [ ] Verify staging deployment works
- [ ] Deploy to production
- [ ] Verify production deployment
- [ ] Test on live URL

### 5. Packaging (Desktop)
- [ ] Create MSIX package for Windows
- [ ] Test MSIX installation
- [ ] Verify app runs after installation
- [ ] Test auto-update mechanism (if implemented)
- [ ] Sign package (if required)

### 6. Post-Release
- [ ] Create GitHub release with notes
- [ ] Upload build artifacts to release
- [ ] Announce release (if applicable)
- [ ] Monitor error tracking for issues
- [ ] Update project board/issues
- [ ] Celebrate! 🎉

## Hotfix Checklist

For urgent bug fixes between releases:

- [ ] Identify and reproduce the bug
- [ ] Create hotfix branch from main
- [ ] Implement minimal fix
- [ ] Write test to prevent regression
- [ ] All tests pass
- [ ] Build and test
- [ ] Bump patch version (e.g., 1.0.0 → 1.0.1)
- [ ] Deploy immediately
- [ ] Monitor for issues
- [ ] Merge hotfix back to main and development branches

## Rollback Plan

If a release has critical issues:

- [ ] Identify the issue severity
- [ ] Notify stakeholders
- [ ] Revert to previous git tag
- [ ] Deploy previous version
- [ ] Verify rollback successful
- [ ] Document what went wrong
- [ ] Create fix plan
- [ ] Update release checklist to prevent recurrence

## Health Check Reference

The `scripts/healthcheck.sh` validates:
1. ✅ Editor component exists and loads
2. ✅ Templates directory has all required templates
3. ✅ Export functionality is available
4. ✅ AI config exists (offline fallback works)
5. ✅ Storage utilities are functional

**Passing all health checks is required before release.**

## Smoke Test Reference

The `scripts/smoke-test.sh` performs:
1. ✅ Create new project
2. ✅ Load template
3. ✅ Edit content
4. ✅ Auto-save works
5. ✅ Export markdown
6. ✅ Export text
7. ✅ AI config validation (optional)

**All smoke tests must pass before release.**

---

**Remember**: Quality over speed. A delayed release is better than a buggy release.

**Last Updated**: 2026-05-23
**Version**: 1.0.0-mvp
