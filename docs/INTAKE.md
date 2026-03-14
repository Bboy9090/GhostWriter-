# GhostWriter — Problem Intake Checklist

Use this document to describe a feature request, bug report, or improvement
so that any contributor (human or AI) can scope and implement it precisely.

---

## 1. Problem type

- [ ] 🐛 Bug — something is broken
- [ ] ✨ Feature — new capability wanted
- [ ] ♻️  Refactor / tech-debt — no behavior change, just cleaner code
- [ ] 📄 Docs — documentation gap
- [ ] 🔒 Security — vulnerability or hardening

---

## 2. Which part of the system is affected?

- [ ] **Frontend** (`src/`, React/TypeScript UI)
- [ ] **Backend API** (`backend-go/`, Go/Fiber)
- [ ] **Database** (PostgreSQL schema / MongoDB collections)
- [ ] **Browser Extension** (`extension/`)
- [ ] **iOS app** (`ios-native/`)
- [ ] **CI / deployment** (`.github/workflows/`, `render.yaml`, `fly.toml`, …)
- [ ] **Other** — describe below

---

## 3. Description

> _Replace this block with a clear 1–3 sentence summary._

**What is happening (or missing)?**

**What should happen instead?**

---

## 4. Steps to reproduce (bugs only)

1. …
2. …
3. …

**Expected result:**

**Actual result / error message:**

```
paste error log here
```

---

## 5. Environment

| Field | Value |
|---|---|
| Deployment target | Render / Railway / Fly.io / local Docker / other |
| Database | PostgreSQL / MongoDB |
| Browser / OS (if frontend) | |
| Go version (if backend) | |
| Node version (if frontend) | |

---

## 6. Acceptance criteria

_What does "done" look like? Bullet-point the observable outcomes._

- [ ] …
- [ ] …

---

## 7. Out of scope

_Anything explicitly NOT part of this work item (helps prevent scope creep)._

---

## 8. Additional context

_Paste relevant logs, screenshots, links, or references here._
