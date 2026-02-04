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
├── src/              # Source code
│   ├── components/   # React components
│   ├── lib/          # Utilities and helpers
│   └── hooks/        # Custom React hooks
├── scripts/          # Build and utility scripts
├── ios-native/       # Native iOS Swift code
├── tests/            # Test files
└── public/           # Static assets
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
