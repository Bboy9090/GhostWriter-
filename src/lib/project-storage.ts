// Project storage utilities for Ghost Writer
// All data stored in browser localStorage

export interface Project {
  id: string;
  title: string;
  template: string;
  content: string;
  created: string;
  modified: string;
  metadata: {
    wordCount: number;
    characterCount: number;
    tags: string[];
    category: string;
  };
}

export interface ProjectMetadata {
  id: string;
  title: string;
  template: string;
  created: string;
  modified: string;
  wordCount: number;
}

const STORAGE_PREFIX = 'ghostwriter';
const PROJECTS_KEY = `${STORAGE_PREFIX}:projects`;

// Generate a unique ID for projects
export function generateProjectId(): string {
  return `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Count words in text
export function countWords(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Count characters (excluding whitespace)
export function countCharacters(text: string): number {
  if (!text) return 0;
  return text.replace(/\s/g, '').length;
}

// Estimate reading time in minutes
export function estimateReadingTime(text: string): number {
  const words = countWords(text);
  const wordsPerMinute = 200; // Average reading speed
  return Math.ceil(words / wordsPerMinute);
}

// Save a project
export function saveProject(project: Project): void {
  try {
    // Update modified timestamp
    project.modified = new Date().toISOString();

    // Update metadata
    project.metadata.wordCount = countWords(project.content);
    project.metadata.characterCount = countCharacters(project.content);

    // Save project content
    const projectKey = `${STORAGE_PREFIX}:project:${project.id}`;
    localStorage.setItem(projectKey, JSON.stringify(project));

    // Update projects index
    const projects = getAllProjectsMetadata();
    const existingIndex = projects.findIndex(p => p.id === project.id);

    const metadata: ProjectMetadata = {
      id: project.id,
      title: project.title,
      template: project.template,
      created: project.created,
      modified: project.modified,
      wordCount: project.metadata.wordCount
    };

    if (existingIndex >= 0) {
      projects[existingIndex] = metadata;
    } else {
      projects.push(metadata);
    }

    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('Error saving project:', error);
    throw new Error('Failed to save project. Storage may be full.');
  }
}

// Get a project by ID
export function getProject(id: string): Project | null {
  try {
    const projectKey = `${STORAGE_PREFIX}:project:${id}`;
    const data = localStorage.getItem(projectKey);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading project:', error);
    return null;
  }
}

// Get all projects metadata (for project list)
export function getAllProjectsMetadata(): ProjectMetadata[] {
  try {
    const data = localStorage.getItem(PROJECTS_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading projects:', error);
    return [];
  }
}

// Delete a project
export function deleteProject(id: string): void {
  try {
    // Remove project content
    const projectKey = `${STORAGE_PREFIX}:project:${id}`;
    localStorage.removeItem(projectKey);

    // Update projects index
    const projects = getAllProjectsMetadata();
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting project:', error);
    throw new Error('Failed to delete project');
  }
}

// Search projects by title or content
export function searchProjects(query: string): Project[] {
  const lowerQuery = query.toLowerCase();
  const metadata = getAllProjectsMetadata();
  const results: Project[] = [];

  for (const meta of metadata) {
    if (meta.title.toLowerCase().includes(lowerQuery)) {
      const project = getProject(meta.id);
      if (project) results.push(project);
    }
  }

  return results;
}

// Get storage usage
export interface StorageStats {
  used: number;
  available: number;
  percentage: number;
}

export function getStorageStats(): StorageStats {
  let used = 0;

  // Calculate used space
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      const value = localStorage.getItem(key);
      if (value) {
        used += key.length + value.length;
      }
    }
  }

  // Estimate available space (browsers typically allow ~5-10MB)
  const estimated = 5 * 1024 * 1024; // 5MB estimate
  const percentage = (used / estimated) * 100;

  return {
    used,
    available: estimated - used,
    percentage: Math.min(percentage, 100)
  };
}

// Clear all projects (for reset/backup purposes)
export function clearAllProjects(): void {
  try {
    const keys: string[] = [];

    // Collect all project keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        keys.push(key);
      }
    }

    // Remove all project data
    keys.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing projects:', error);
    throw new Error('Failed to clear projects');
  }
}

// Export all projects as JSON
export function exportAllProjects(): Blob {
  const metadata = getAllProjectsMetadata();
  const projects: Project[] = [];

  for (const meta of metadata) {
    const project = getProject(meta.id);
    if (project) projects.push(project);
  }

  const exportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    projects
  };

  const json = JSON.stringify(exportData, null, 2);
  return new Blob([json], { type: 'application/json' });
}

// Import projects from JSON
export function importProjects(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        if (!data.projects || !Array.isArray(data.projects)) {
          throw new Error('Invalid backup file format');
        }

        let imported = 0;
        for (const project of data.projects) {
          // Generate new ID to avoid conflicts
          project.id = generateProjectId();
          project.created = new Date().toISOString();
          project.modified = new Date().toISOString();

          saveProject(project);
          imported++;
        }

        resolve(imported);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// Create a new project
export function createProject(title: string, templateId: string, content: string = ''): Project {
  const now = new Date().toISOString();

  const project: Project = {
    id: generateProjectId(),
    title: title || 'Untitled Document',
    template: templateId,
    content,
    created: now,
    modified: now,
    metadata: {
      wordCount: countWords(content),
      characterCount: countCharacters(content),
      tags: [],
      category: ''
    }
  };

  saveProject(project);
  return project;
}
