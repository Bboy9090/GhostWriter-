# Contributing to GhostWriter

Thank you for your interest in contributing to GhostWriter! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

1. **Fork the repository** and clone your fork:
   ```bash
   git clone https://github.com/your-username/GhostWriter-.git
   cd GhostWriter-
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📋 Development Workflow

### Code Style

- Follow the existing code style and conventions
- Use TypeScript for all new code
- Run `npm run lint` before committing
- Ensure all tests pass: `npm test`

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Example:
```
feat: Add OCR deduplication algorithm
fix: Resolve memory leak in video frame extraction
docs: Update README with iOS setup instructions
```

### Pull Request Process

1. **Update documentation** if you're adding features or changing behavior
2. **Add tests** for new functionality
3. **Ensure all checks pass** (linting, tests, build)
4. **Write a clear PR description** explaining:
   - What changes were made
   - Why they were made
   - How to test the changes
   - Any breaking changes

5. **Request review** from maintainers

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Writing Tests

- Write tests for all new features
- Aim for >80% code coverage
- Test edge cases and error conditions
- Use descriptive test names

## 🏗️ Project Structure

```
GhostWriter-/
├── src/              # Frontend React/TypeScript source
│   ├── components/   # React components
│   ├── lib/          # Utilities and helpers
│   └── hooks/        # Custom React hooks
├── backend-go/       # Go backend API (Fiber framework)
│   ├── cmd/server/   # main.go entry point
│   └── internal/     # database, handlers, redis, …
├── extension/        # Chrome browser extension
├── ios-native/       # Native iOS Swift code
├── scripts/          # Build and utility scripts
├── tests/            # E2E tests (Playwright)
├── docs/             # Project documentation and intake forms
└── public/           # Static assets
```

## 🔧 Running the Go Backend locally

Prerequisites: **Go 1.22+**, **Docker** (for PostgreSQL + Redis).

```bash
# 1. Start dependencies
docker compose up -d postgres redis

# 2. Copy and edit environment variables
cp backend-go/.env.template backend-go/.env
# Set DB_URL, REDIS_URL, JWT_SECRET (≥32 chars), etc.

# 3. Build and run
cd backend-go
go build -o server ./cmd/server
./server
# API listens on http://localhost:8080
# Health check: curl http://localhost:8080/health
```

### Backend environment variables

| Variable | Description | Default |
|---|---|---|
| `DB_URL` | PostgreSQL DSN **or** MongoDB URI | local Postgres |
| `MONGODB_URI` | MongoDB URI (takes precedence over `DB_URL`) | — |
| `REDIS_URL` | `host:port` | `localhost:6379` |
| `JWT_SECRET` | ≥32-char secret | required |
| `PORT` | HTTP listen port | `8080` |
| `OPENAI_API_KEY` | Enables vector embeddings | optional |

> **MongoDB on Railway**: set `MONGODB_URI` to your Railway connection string.  
> The server checks `MONGODB_URI` first; if set, it is used directly.  
> Otherwise `DB_URL` is used, and the backend auto-detects `mongodb://` /
> `mongodb+srv://` URIs and routes them to the MongoDB driver instead of
> PostgreSQL.

### Running Go tests

```bash
cd backend-go
go test -v ./...
```

## 🐛 Reporting Bugs

When reporting bugs, please include:

1. **Description** of the bug
2. **Steps to reproduce**
3. **Expected behavior**
4. **Actual behavior**
5. **Environment** (OS, Node version, browser, etc.)
6. **Screenshots** if applicable
7. **Error messages** or logs

## 💡 Feature Requests

For feature requests:

1. Check if the feature already exists or is planned
2. Open an issue with the `enhancement` label
3. Describe the use case and expected behavior
4. Consider implementation complexity

## 📝 Code Review Guidelines

- Be respectful and constructive
- Focus on the code, not the person
- Explain your reasoning
- Suggest improvements, don't just criticize
- Approve when you're satisfied

## 🔒 Security

If you discover a security vulnerability:

1. **Do NOT** open a public issue
2. Email security concerns to the maintainers
3. Include detailed information about the vulnerability
4. Allow time for the issue to be addressed before disclosure

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## 🙏 Thank You

Your contributions make GhostWriter better for everyone. Thank you for taking the time to contribute!
