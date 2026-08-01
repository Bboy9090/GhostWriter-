// Export functionality for Ghost Writer
// Supports markdown and plain text export

import type { Project } from './project-storage';

// Strip markdown formatting from text
export function stripMarkdown(text: string): string {
  return text
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    // Remove italic
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    // Remove links
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    // Remove images
    .replace(/!\[(.+?)\]\(.+?\)/g, '$1')
    // Remove inline code
    .replace(/`(.+?)`/g, '$1')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove list markers
    .replace(/^[*+-]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    // Remove horizontal rules
    .replace(/^[*_-]{3,}$/gm, '')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Sanitize filename for download
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9\s\-_]/gi, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .substring(0, 100); // Limit length
}

// Generate markdown frontmatter
export function generateFrontmatter(project: Project): string {
  return `---
title: ${project.title}
template: ${project.template}
created: ${project.created}
modified: ${project.modified}
words: ${project.metadata.wordCount}
characters: ${project.metadata.characterCount}
${project.metadata.tags.length > 0 ? `tags: ${project.metadata.tags.join(', ')}` : ''}
---

`;
}

// Export project as markdown
export function exportAsMarkdown(project: Project, includeFrontmatter = true): void {
  let content = '';

  if (includeFrontmatter) {
    content += generateFrontmatter(project);
  }

  content += project.content;

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  downloadBlob(blob, `${sanitizeFilename(project.title)}.md`);
}

// Export project as plain text
export function exportAsText(project: Project): void {
  const plainText = stripMarkdown(project.content);

  // Add simple header
  const content = `${project.title}
${'='.repeat(project.title.length)}

${plainText}

---
Created: ${new Date(project.created).toLocaleDateString()}
Word count: ${project.metadata.wordCount}
`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, `${sanitizeFilename(project.title)}.txt`);
}

// Helper function to trigger download
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

// Export multiple projects as a single file
export function exportMultipleProjects(projects: Project[], format: 'markdown' | 'text'): void {
  let content = '';

  if (format === 'markdown') {
    content = `# Ghost Writer Export\n\n`;
    content += `Exported: ${new Date().toISOString()}\n`;
    content += `Projects: ${projects.length}\n\n`;
    content += `---\n\n`;

    for (const project of projects) {
      content += `# ${project.title}\n\n`;
      content += `*Template: ${project.template} | `;
      content += `Words: ${project.metadata.wordCount} | `;
      content += `Created: ${new Date(project.created).toLocaleDateString()}*\n\n`;
      content += `${project.content}\n\n`;
      content += `---\n\n`;
    }

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    downloadBlob(blob, `ghostwriter-export-${Date.now()}.md`);
  } else {
    content = `GHOST WRITER EXPORT\n`;
    content += `${'='.repeat(60)}\n\n`;
    content += `Exported: ${new Date().toISOString()}\n`;
    content += `Projects: ${projects.length}\n\n`;

    for (const project of projects) {
      content += `\n${'-'.repeat(60)}\n\n`;
      content += `${project.title}\n`;
      content += `${'='.repeat(project.title.length)}\n\n`;
      content += `${stripMarkdown(project.content)}\n\n`;
      content += `Created: ${new Date(project.created).toLocaleDateString()}\n`;
      content += `Words: ${project.metadata.wordCount}\n`;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `ghostwriter-export-${Date.now()}.txt`);
  }
}

// Get export preview (first N characters)
export function getExportPreview(project: Project, format: 'markdown' | 'text', maxChars = 200): string {
  let content = '';

  if (format === 'markdown') {
    content = generateFrontmatter(project) + project.content;
  } else {
    content = stripMarkdown(project.content);
  }

  if (content.length <= maxChars) {
    return content;
  }

  return content.substring(0, maxChars) + '...';
}
