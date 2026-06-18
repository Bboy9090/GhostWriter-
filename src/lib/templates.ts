// Template definitions for Ghost Writer
// Each template provides structure and placeholders for common writing formats

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'professional' | 'creative' | 'academic';
  content: string;
}

export const TEMPLATES: Template[] = [
  {
    id: 'blank',
    name: 'Blank Document',
    description: 'Start from scratch',
    icon: '📄',
    category: 'professional',
    content: ''
  },
  {
    id: 'email',
    name: 'Email',
    description: 'Professional or personal email',
    icon: '📧',
    category: 'professional',
    content: `Subject: [Your Subject]

Hi [Recipient Name],

[Opening paragraph - state your purpose clearly]

[Body paragraph - provide necessary details, context, or information]

[Closing paragraph - include call to action or next steps]

Best regards,
[Your Name]`
  },
  {
    id: 'essay',
    name: 'Essay',
    description: 'Academic or opinion essay structure',
    icon: '📝',
    category: 'academic',
    content: `# [Essay Title]

## Introduction

[Hook: Start with an interesting fact, question, or statement]

[Background: Provide context for your topic]

[Thesis statement: Clearly state your main argument or position]

## Body Paragraph 1

[Topic sentence: Introduce the first main point]

[Evidence: Provide facts, examples, or quotes to support your point]

[Analysis: Explain how the evidence supports your thesis]

[Transition: Connect to the next point]

## Body Paragraph 2

[Topic sentence: Introduce the second main point]

[Evidence: Provide facts, examples, or quotes to support your point]

[Analysis: Explain how the evidence supports your thesis]

[Transition: Connect to the next point]

## Body Paragraph 3

[Topic sentence: Introduce the third main point]

[Evidence: Provide facts, examples, or quotes to support your point]

[Analysis: Explain how the evidence supports your thesis]

[Transition: Lead into the conclusion]

## Conclusion

[Restate thesis: Summarize your main argument]

[Summary: Briefly recap your main points]

[Closing thought: End with a powerful statement or call to action]`
  },
  {
    id: 'script',
    name: 'Script',
    description: 'Screenplay or dialogue format',
    icon: '🎬',
    category: 'creative',
    content: `# [Script Title]

**Written by:** [Your Name]

---

## Scene 1: [LOCATION] - [TIME OF DAY]

*[Stage direction or scene description]*

**CHARACTER 1:** Dialogue goes here. Keep it natural and conversational.

**CHARACTER 2:** Response dialogue. Make sure each character has a distinct voice.

*[Action line describing what's happening]*

**CHARACTER 1:** More dialogue.

---

## Scene 2: [LOCATION] - [TIME OF DAY]

*[Stage direction or scene description]*

**CHARACTER 1:** Continue the story...

**CHARACTER 3:** New character introduction dialogue.

*[Action line]*

---

## Scene 3: [LOCATION] - [TIME OF DAY]

*[Continue building your story...]*`
  },
  {
    id: 'blog',
    name: 'Blog Post',
    description: 'Blog article with intro, body, conclusion',
    icon: '📱',
    category: 'professional',
    content: `# [Your Catchy Blog Title]

*Published: [Date] | Reading time: [X] min | By [Your Name]*

---

## Introduction

[Hook: Grab your reader's attention with a compelling opening]

[Preview: Tell readers what they'll learn or gain from this post]

---

## [Section 1 Heading]

[Content for your first main point]

- Key point 1
- Key point 2
- Key point 3

[Elaborate on these points with examples or explanations]

---

## [Section 2 Heading]

[Content for your second main point]

**Pro tip:** [Share a helpful insight or tip]

[Continue with more details, examples, or stories]

---

## [Section 3 Heading]

[Content for your third main point]

> "Include a relevant quote or highlight key information in a blockquote"

[Wrap up this section with actionable advice]

---

## Conclusion

[Summary: Recap the main points you've covered]

[Call to action: What should readers do next?]

---

**Tags:** #[tag1] #[tag2] #[tag3]

**Share this post:** [Social media links]

**Comments:** What do you think? Share your thoughts below!`
  },
  {
    id: 'chapter',
    name: 'Chapter',
    description: 'Book chapter with scenes and sections',
    icon: '📖',
    category: 'creative',
    content: `# Chapter [Number]: [Chapter Title]

---

## Scene 1

[Setting description: Where and when is this scene taking place?]

[Narrative: Begin your story. Introduce characters, conflict, or atmosphere]

[Continue with action and dialogue...]

---

## Scene 2

[Setting description: New location or time shift]

[Narrative: Develop the story further. Build tension or deepen character relationships]

[Show, don't tell - use vivid descriptions and realistic dialogue]

---

## Scene 3

[Setting description]

[Narrative: Continue building toward a climax or revelation]

[End the chapter with a hook to keep readers turning pages]

---

*End of Chapter [Number]*

**Notes:**
- Character development moments:
- Plot points advanced:
- Foreshadowing elements:
- Next chapter preview:`
  }
];

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByCategory(category: Template['category']): Template[] {
  return TEMPLATES.filter(t => t.category === category);
}

export function getAllTemplates(): Template[] {
  return TEMPLATES;
}
