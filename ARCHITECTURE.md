# Architecture Documentation

## Overview

GhostWriter is built with a modern, scalable architecture that prioritizes performance, maintainability, and developer experience.

## Technology Stack

### Frontend

- **React 19.2** - Latest React with concurrent features
- **TypeScript 5.9** - Type-safe development with strict mode
- **Vite 7.2** - Lightning-fast build tool and dev server
- **Tailwind CSS 4.1** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **TanStack Query** - Powerful data synchronization

### Testing

- **Vitest** - Fast unit test framework
- **Testing Library** - React component testing utilities
- **jsdom** - DOM environment for testing

### Development Tools

- **ESLint** - Code linting and quality
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Pre-commit linting

## Project Structure

```
GhostWriter-/
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # Reusable UI primitives
│   │   └── ...           # Feature components
│   ├── lib/              # Utilities and helpers
│   ├── hooks/            # Custom React hooks
│   ├── styles/           # Global styles
│   └── test/             # Test utilities and setup
├── scripts/              # Build and utility scripts
│   └── ocr-adapters/     # OCR adapter implementations
├── ios-native/           # Native iOS Swift code
├── tests/                # Test files
├── public/               # Static assets
└── .github/              # GitHub workflows and templates
```

## Capture → vault flows (actual behavior)

- **Local vault (browser):** React UI + `capture-store` (`localStorage`, `BroadcastChannel`). Entries pass through `capture-filters` (noise, sensitive, dedup).
- **Screenshot OCR (web):** Tesseract.js via `src/lib/ocr-browser.ts` when users drop an image on the main dropzone; video OCR belongs in **Dev → iOS Upload**.
- **Server vault (optional):** `backend-go` exposes `POST /vault/search` (hybrid vector + keyword), `GET /entries`, and `GET /ws` for WebSocket text ingest. Database: PostgreSQL + pgvector **or** MongoDB (in-memory cosine for vectors).
- **Semantic search in the main UI:** Opt-in via `VITE_API_URL` / `VITE_GHOSTWRITER_API_URL` and `VITE_GHOSTWRITER_USER_ID` (see `docs/CAPTURE_TO_VAULT.md`).

## Key Architectural Decisions

### 1. Component Architecture

- **Atomic Design**: Components organized by complexity (atoms → molecules → organisms)
- **Composition over Inheritance**: Prefer composition patterns
- **Separation of Concerns**: UI components separate from business logic

### 2. State Management

- **React Query**: Server state and caching
- **Local State**: React hooks for component state
- **Context API**: Theme and global settings

### 3. Type Safety

- **Strict TypeScript**: Maximum type safety enabled
- **Zod**: Runtime type validation
- **Type Inference**: Leverage TypeScript's inference capabilities

### 4. Performance

- **Code Splitting**: Route-based code splitting
- **Lazy Loading**: Dynamic imports for heavy components
- **Memoization**: Strategic use of React.memo and useMemo

### 5. Testing Strategy

- **Unit Tests**: Component and utility function tests
- **Integration Tests**: Feature workflow tests
- **E2E Tests**: Critical user journeys (planned)

## Build Process

1. **Type Checking**: TypeScript compilation with strict mode
2. **Linting**: ESLint for code quality
3. **Formatting**: Prettier for consistent style
4. **Testing**: Vitest for unit and integration tests
5. **Building**: Vite for optimized production builds

## CI/CD Pipeline

### Continuous Integration

- Lint and type check on every PR
- Run test suite
- Build verification
- Security scanning

### Continuous Deployment

- Automated releases on version tags
- Build artifacts generation
- Release notes generation

## Security Considerations

- **Dependency Scanning**: Automated vulnerability detection
- **Code Review**: All changes require review
- **Secret Management**: Environment variables for sensitive data
- **HTTPS Only**: All network communication encrypted

## Performance Metrics

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Bundle Size**: Optimized with tree-shaking
- **Lighthouse Score**: 90+ across all metrics

## Future Improvements

- [ ] Micro-frontend architecture for scalability
- [ ] Service Worker for offline support
- [ ] WebAssembly for performance-critical operations
- [ ] GraphQL API integration
- [ ] Real-time collaboration features
