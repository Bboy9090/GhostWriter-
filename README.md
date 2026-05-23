# Ghost Writer

**AI-powered writing and publishing studio for Bobby's World / Blue Phoenix OS**

Ghost Writer is a productivity-focused writing application that helps you create, organize, and export written content. With built-in templates, optional AI assistance, and flexible export options, Ghost Writer empowers you to focus on your craft.

---

## ✨ Features

### 📝 Writing Editor
- Clean, distraction-free markdown editor
- Auto-save every 2 seconds
- Word count and reading time estimates
- Dark mode optimized for extended writing

### 📄 Built-in Templates
- **Email** - Professional and personal email formats
- **Essay** - Academic and opinion essay structures
- **Script** - Screenplay and dialogue formats
- **Blog** - Blog post with intro, body, conclusion
- **Chapter** - Book chapter with scenes and sections

### 🤖 AI Assistance (Optional)
- Content suggestions and improvements
- Grammar and style checking
- Tone adjustments
- Works completely offline - AI is optional, not required
- Privacy-first: No AI calls without explicit consent

### 📤 Export Options
- Markdown (.md) - Preserves formatting
- Plain text (.txt) - Universal compatibility
- Future: PDF, DOCX, HTML

### 💾 Local Project Storage
- All data stored locally in your browser
- Project organization by type and date
- Search across all projects
- Backup and restore functionality

---

## 🚀 Quick Start

### One-Line Install and Run

```bash
npm install && npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to start writing.

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

---

## 📦 Installation

### Prerequisites
- **Node.js** 20 or higher
- **npm** 10 or higher

### Install Dependencies

```bash
npm install
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run lint` | Check code quality |
| `npm run format` | Format code with Prettier |
| `npm run type-check` | Check TypeScript types |

---

## 🧪 Testing & Validation

### Health Check

Validates that all core components are present and functional:

```bash
./scripts/healthcheck.sh
```

Checks:
- ✅ Build artifacts
- ✅ Core components (editor, storage, templates)
- ✅ Export functionality
- ✅ AI configuration (optional)
- ✅ Documentation completeness

### Smoke Test

End-to-end workflow test:

```bash
./scripts/smoke-test.sh
```

Tests:
- ✅ Build process
- ✅ TypeScript compilation
- ✅ Linting
- ✅ Documentation
- ✅ Package metadata
- ✅ Build size optimization

---

## 📱 Packaging

### Windows (MSIX)

Package Ghost Writer for Windows and Blue Phoenix OS:

```bash
npm run build
# See packaging/README.md for detailed instructions
```

### Web Deployment

Deploy to any static hosting provider:

**Vercel (Recommended):**
```bash
npm install -g vercel
vercel --prod
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

**See [packaging/README.md](./packaging/README.md) for complete packaging guide.**

---

## 🏗️ Architecture

### Tech Stack

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS 4
- **UI Components:** Radix UI
- **Storage:** localStorage (browser-native)
- **AI Integration:** Configurable API endpoints (optional)

### Project Structure

```
ghost-writer/
├── src/
│   ├── components/        # React components
│   │   ├── Editor.tsx     # Main writing editor
│   │   ├── Templates.tsx  # Template selector
│   │   ├── Projects.tsx   # Project management
│   │   └── ui/            # Reusable UI components
│   ├── lib/               # Core utilities
│   │   ├── storage.ts     # Local storage management
│   │   ├── export.ts      # Export functionality
│   │   ├── ai-config.ts   # AI provider configuration
│   │   └── templates.ts   # Template definitions
│   ├── templates/         # Built-in templates
│   ├── App.tsx            # Main application
│   └── main.tsx           # Entry point
├── docs/                  # Documentation
│   ├── PRD.md            # Product requirements
│   ├── ROADMAP.md        # Feature roadmap
│   ├── RELEASE_CHECKLIST.md
│   └── WRITING_PIPELINE.md
├── scripts/               # Build and test scripts
│   ├── healthcheck.sh    # Component validation
│   └── smoke-test.sh     # End-to-end tests
├── packaging/             # Platform packaging guides
└── app.metadata.json      # App metadata
```

---

## 🔒 Privacy & Security

Ghost Writer is designed with privacy as a core principle:

- **Local-first:** All data stored in your browser's localStorage
- **No cloud required:** Fully functional offline
- **AI is optional:** Works perfectly without any AI features
- **Transparent AI usage:** Clear indication when AI is active
- **User consent:** Explicit permission required before any AI calls
- **No tracking:** No analytics or telemetry without your consent

---

## 🗺️ Roadmap

### Phase 1: MVP ✅ (Current)
- Writing editor with markdown support
- Built-in templates
- AI provider configuration (optional)
- Export as markdown/txt
- Local project storage

### Phase 2: Enhanced Features (Q3 2026)
- Custom template creation
- Project import/export
- Enhanced editor UX
- Advanced search and filtering

### Phase 3: Publishing (Q4 2026)
- Multi-format export (PDF, DOCX, HTML)
- Direct publishing to platforms
- Advanced AI features
- Collaboration tools

### Phase 4: Blue Phoenix OS Integration (Q1 2027)
- Native desktop app
- System-level integrations
- Offline AI models
- Cross-device sync

**See [docs/ROADMAP.md](./docs/ROADMAP.md) for detailed roadmap.**

---

## 📚 Documentation

- **[PRD.md](./docs/PRD.md)** - Product requirements and vision
- **[ROADMAP.md](./docs/ROADMAP.md)** - Feature roadmap and timeline
- **[WRITING_PIPELINE.md](./docs/WRITING_PIPELINE.md)** - Writing workflow and technical pipeline
- **[RELEASE_CHECKLIST.md](./docs/RELEASE_CHECKLIST.md)** - Pre-release validation steps
- **[packaging/README.md](./packaging/README.md)** - Platform packaging guides

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

## 🆘 Support

- **Issues:** [GitHub Issues](https://github.com/Bboy9090/GhostWriter-/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Bboy9090/GhostWriter-/discussions)
- **Email:** feedback@bobbysworld.com

---

**Ghost Writer** - *Write without limits. Publish with confidence.* ✍️
