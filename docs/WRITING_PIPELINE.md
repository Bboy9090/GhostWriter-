# Ghost Writer - Writing Pipeline

This document describes the writing workflow and technical pipeline in Ghost Writer.

## 🎯 Overview

Ghost Writer provides a streamlined writing pipeline from idea to published content. The pipeline is designed to be simple, fast, and privacy-conscious, with AI assistance as an optional enhancement.

---

## 📝 Writing Workflow

### 1. Create Project

**User Flow:**
```
Open App → New Project → Choose Template (or Blank) → Start Writing
```

**Technical Flow:**
```
1. User clicks "New Project"
2. Template selector appears (or skip to blank)
3. Create project object with metadata:
   - id: unique identifier
   - title: user-provided or "Untitled"
   - template: template name or "blank"
   - created: timestamp
   - modified: timestamp
   - content: template content or empty string
   - metadata: tags, category, etc.
4. Store in localStorage
5. Open editor with project loaded
```

**Storage Structure:**
```json
{
  "id": "proj_abc123",
  "title": "My Essay",
  "template": "essay",
  "created": "2026-05-23T16:00:00Z",
  "modified": "2026-05-23T16:30:00Z",
  "content": "# Essay Title\n\n## Introduction\n...",
  "metadata": {
    "tags": ["academic", "draft"],
    "category": "essays",
    "wordCount": 500,
    "aiEnabled": false
  }
}
```

---

### 2. Writing & Editing

**User Flow:**
```
Type in Editor → Auto-Save Every 2s → Word Count Updates → Optional AI Assist
```

**Technical Flow:**
```
1. User types in editor
2. Editor state managed by React
3. Debounced auto-save (2 second delay)
4. Update project in localStorage
5. Update metadata (word count, modified timestamp)
6. Display status indicator ("Saved" / "Saving...")
```

**Editor Features:**
- Markdown support
- Live word count
- Reading time estimate
- Distraction-free mode
- Keyboard shortcuts
- Undo/redo (browser native)

**Auto-Save Logic:**
```typescript
// Simplified auto-save implementation
const debouncedSave = debounce((content: string, projectId: string) => {
  const project = getProject(projectId);
  project.content = content;
  project.modified = new Date().toISOString();
  project.metadata.wordCount = countWords(content);
  saveProject(project);
  showStatus('Saved');
}, 2000);

// On content change
editor.onChange((newContent) => {
  showStatus('Saving...');
  debouncedSave(newContent, currentProjectId);
});
```

---

### 3. AI Assistance (Optional)

**User Flow:**
```
Select Text → AI Menu → Choose Action → Review Suggestion → Accept/Reject
```

**Available AI Actions:**
- **Improve**: Enhance clarity and style
- **Shorten**: Make more concise
- **Expand**: Add more detail
- **Fix Grammar**: Correct errors
- **Change Tone**: Professional, casual, formal, friendly

**Technical Flow:**
```
1. User selects text
2. AI menu appears (only if AI configured)
3. User chooses action
4. Send request to configured AI provider
5. Display loading indicator
6. Receive AI suggestion
7. Show diff/comparison
8. User accepts or rejects
9. If accepted, update content
10. Trigger auto-save
```

**AI Provider Configuration:**
```json
{
  "aiProvider": {
    "enabled": false,
    "endpoint": "https://api.openai.com/v1/chat/completions",
    "apiKey": "sk-...",
    "model": "gpt-4",
    "offlineFallback": true
  }
}
```

**Privacy & Consent:**
- AI disabled by default
- Explicit opt-in required
- Clear indicator when AI is active
- Option to disable at any time
- No data sent without user action

---

### 4. Templates

**Available Templates:**

#### Email
```markdown
Subject: [Subject Line]

Hi [Recipient],

[Opening paragraph - state purpose]

[Body paragraphs - provide details]

[Closing paragraph - call to action]

Best regards,
[Your Name]
```

#### Essay
```markdown
# [Essay Title]

## Introduction
[Hook and thesis statement]

## Body Paragraph 1
[Topic sentence]
[Supporting evidence]
[Analysis]

## Body Paragraph 2
[Topic sentence]
[Supporting evidence]
[Analysis]

## Body Paragraph 3
[Topic sentence]
[Supporting evidence]
[Analysis]

## Conclusion
[Restate thesis]
[Summary of main points]
[Closing thoughts]
```

#### Script
```markdown
# [Script Title]

## Scene 1: [Location] - [Time of Day]

**Character 1:** Dialogue here.

**Character 2:** Response dialogue.

*[Stage direction]*

**Character 1:** More dialogue.

---

## Scene 2: [Location] - [Time of Day]

[Continue...]
```

#### Blog Post
```markdown
# [Blog Title]

*Published: [Date] | Reading time: [X] min*

## Introduction
[Hook - grab reader's attention]
[What you'll cover]

## Main Content

### Section 1: [Heading]
[Content]

### Section 2: [Heading]
[Content]

### Section 3: [Heading]
[Content]

## Conclusion
[Summary]
[Call to action]

---

**Tags:** #tag1 #tag2 #tag3
```

#### Chapter
```markdown
# Chapter [Number]: [Chapter Title]

## Scene 1
[Setting description]

[Narrative content...]

---

## Scene 2
[Setting description]

[Narrative content...]

---

## Scene 3
[Setting description]

[Narrative content...]
```

**Template System:**
```typescript
interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  content: string;
  category: 'professional' | 'creative' | 'academic';
}

const templates: Template[] = [
  {
    id: 'email',
    name: 'Email',
    description: 'Professional or personal email',
    icon: '📧',
    content: emailTemplate,
    category: 'professional'
  },
  // ... other templates
];
```

---

### 5. Export

**User Flow:**
```
Finish Writing → Export Button → Choose Format → Download File
```

**Supported Formats (MVP):**
- **Markdown (.md)** - Preserves all formatting
- **Plain Text (.txt)** - Strips formatting

**Future Formats:**
- PDF with styling
- DOCX (Microsoft Word)
- HTML
- EPUB (ebooks)

**Technical Flow:**
```
1. User clicks "Export"
2. Format selector appears
3. User selects format (markdown or txt)
4. Generate file content:
   - Markdown: Use content as-is
   - Text: Strip markdown formatting
5. Add metadata to file (title, date, word count as comment)
6. Create Blob
7. Trigger browser download
8. Show success message
```

**Export Implementation:**
```typescript
function exportAsMarkdown(project: Project): void {
  const content = `---
title: ${project.title}
created: ${project.created}
modified: ${project.modified}
words: ${project.metadata.wordCount}
---

${project.content}`;

  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFilename(project.title)}.md`;
  link.click();
  URL.revokeObjectURL(url);
}

function exportAsText(project: Project): void {
  // Strip markdown formatting
  const plainText = stripMarkdown(project.content);
  const blob = new Blob([plainText], { type: 'text/plain' });
  // ... same download logic
}
```

---

## 🗄️ Local Storage Architecture

**Storage Keys:**
```
ghostwriter:projects        - Array of project metadata
ghostwriter:project:{id}    - Individual project content
ghostwriter:settings        - App settings
ghostwriter:ai-config       - AI provider configuration
ghostwriter:templates       - Custom templates (future)
```

**Storage Management:**
```typescript
// Project CRUD operations
function saveProject(project: Project): void;
function getProject(id: string): Project | null;
function getAllProjects(): ProjectMetadata[];
function deleteProject(id: string): void;
function searchProjects(query: string): Project[];

// Settings
function getSettings(): Settings;
function updateSettings(settings: Partial<Settings>): void;

// Storage utilities
function getStorageUsage(): { used: number, available: number };
function clearStorage(): void;
function exportBackup(): Blob;
function importBackup(file: File): Promise<void>;
```

**Storage Limits:**
- localStorage: ~5-10MB (browser-dependent)
- Fallback to IndexedDB for large projects (future)
- Warning when approaching limit
- Auto-cleanup of deleted projects

---

## 🔄 State Management

**App State:**
```typescript
interface AppState {
  currentProject: Project | null;
  projects: ProjectMetadata[];
  settings: Settings;
  ui: {
    theme: 'light' | 'dark';
    sidebarOpen: boolean;
    focusMode: boolean;
  };
  ai: {
    enabled: boolean;
    loading: boolean;
    suggestion: string | null;
  };
}
```

**React State Management:**
- useState for local component state
- useContext for global settings
- Custom hooks for storage operations
- No external state library needed (MVP)

---

## 🔒 Privacy & Security

**Data Handling:**
- All data stored locally (localStorage)
- No server-side storage (MVP)
- No analytics or tracking
- No automatic cloud sync
- AI only with explicit consent

**Best Practices:**
- Regular auto-save prevents data loss
- Export frequently for backup
- Clear storage option available
- No sensitive data in error logs

---

## 🚀 Performance Optimization

**Load Time:**
- Lazy load templates
- Code splitting for AI features
- Minimal initial bundle

**Runtime:**
- Debounced auto-save
- Virtual scrolling for project list (future)
- Memoized components
- Optimistic UI updates

**Storage:**
- Compress old projects (future)
- Archive to IndexedDB (future)
- Cleanup deleted projects

---

## 🧪 Testing Pipeline

**Unit Tests:**
```bash
npm test
```
Tests:
- Template loading
- Export functions
- Storage operations
- Word count accuracy
- Auto-save logic

**E2E Tests:**
```bash
npm run test:e2e
```
Tests:
- Create new project
- Edit and save
- Switch templates
- Export files
- AI assistance flow (if enabled)

**Health Check:**
```bash
scripts/healthcheck.sh
```
Validates:
- Editor component loads
- Templates available
- Export functions work
- Storage accessible
- AI config valid (or offline)

**Smoke Test:**
```bash
scripts/smoke-test.sh
```
End-to-end workflow test

---

## 📊 Metrics & Analytics

**User Metrics (Privacy-Conscious):**
- Local only, never sent to server
- Word count history
- Writing session duration
- Templates used
- Export formats preferred

**Performance Metrics:**
- Page load time
- Auto-save latency
- Export generation time
- Storage usage

---

**Last Updated**: 2026-05-23
**Version**: 1.0.0-mvp
