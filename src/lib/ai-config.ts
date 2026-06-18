// AI provider configuration for Ghost Writer
// AI assistance is completely optional - app works fully offline

export interface AIConfig {
  enabled: boolean;
  provider: 'openai' | 'anthropic' | 'custom' | 'none';
  apiKey: string;
  endpoint: string;
  model: string;
  offlineFallback: boolean;
}

export interface AIAction {
  id: string;
  name: string;
  description: string;
  icon: string;
  prompt: string;
}

const STORAGE_KEY = 'ghostwriter:ai-config';

// Default AI configuration (disabled by default)
const DEFAULT_CONFIG: AIConfig = {
  enabled: false,
  provider: 'none',
  apiKey: '',
  endpoint: '',
  model: '',
  offlineFallback: true
};

// Available AI actions
export const AI_ACTIONS: AIAction[] = [
  {
    id: 'improve',
    name: 'Improve Writing',
    description: 'Enhance clarity and style',
    icon: '✨',
    prompt: 'Please improve the following text for clarity and style while maintaining the original meaning:\n\n'
  },
  {
    id: 'shorten',
    name: 'Make Concise',
    description: 'Reduce word count',
    icon: '✂️',
    prompt: 'Please make the following text more concise while keeping the key points:\n\n'
  },
  {
    id: 'expand',
    name: 'Add Detail',
    description: 'Elaborate and expand',
    icon: '🔍',
    prompt: 'Please expand on the following text with more detail and examples:\n\n'
  },
  {
    id: 'grammar',
    name: 'Fix Grammar',
    description: 'Correct errors',
    icon: '📝',
    prompt: 'Please fix any grammar, spelling, and punctuation errors in the following text:\n\n'
  },
  {
    id: 'professional',
    name: 'Professional Tone',
    description: 'Make more formal',
    icon: '💼',
    prompt: 'Please rewrite the following text in a professional, formal tone:\n\n'
  },
  {
    id: 'casual',
    name: 'Casual Tone',
    description: 'Make more conversational',
    icon: '😊',
    prompt: 'Please rewrite the following text in a casual, friendly tone:\n\n'
  },
  {
    id: 'summarize',
    name: 'Summarize',
    description: 'Create a summary',
    icon: '📋',
    prompt: 'Please provide a concise summary of the following text:\n\n'
  }
];

// Get AI configuration
export function getAIConfig(): AIConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
  } catch (error) {
    console.error('Error loading AI config:', error);
    return DEFAULT_CONFIG;
  }
}

// Save AI configuration
export function saveAIConfig(config: AIConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error saving AI config:', error);
    throw new Error('Failed to save AI configuration');
  }
}

// Check if AI is available and configured
export function isAIAvailable(): boolean {
  const config = getAIConfig();
  return config.enabled && config.provider !== 'none' && config.apiKey.length > 0;
}

// Get AI action by ID
export function getAIAction(id: string): AIAction | undefined {
  return AI_ACTIONS.find(action => action.id === id);
}

// Apply AI action to text (stub - requires API implementation)
export async function applyAIAction(
  actionId: string
): Promise<{ success: boolean; result?: string; error?: string }> {
  const config = getAIConfig();

  // Check if AI is enabled and configured
  if (!isAIAvailable()) {
    return {
      success: false,
      error: 'AI is not configured. Enable AI in settings to use this feature.'
    };
  }

  const action = getAIAction(actionId);
  if (!action) {
    return {
      success: false,
      error: 'Invalid AI action'
    };
  }

  try {
    // This is a stub - in a real implementation, you would call the AI API here
    // For MVP, we return a placeholder response

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return a message indicating AI is not yet implemented
    return {
      success: false,
      error: 'AI integration is not yet implemented. This feature will be available in a future update.\n\nFor now, Ghost Writer works perfectly offline without AI assistance!'
    };

    // Real implementation would look like:
    // const response = await callAIAPI(config, action.prompt + text);
    // return { success: true, result: response };

  } catch (error) {
    console.error('AI action error:', error);

    // Fallback behavior when AI is not available
    if (config.offlineFallback) {
      return {
        success: false,
        error: 'AI service is unavailable. Ghost Writer works fully offline without AI features.'
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'AI request failed'
    };
  }
}

// Validate AI configuration
export function validateAIConfig(config: AIConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.enabled) {
    if (config.provider === 'none') {
      errors.push('Please select an AI provider');
    }

    if (!config.apiKey || config.apiKey.trim().length === 0) {
      errors.push('API key is required');
    }

    if (config.provider === 'custom' && (!config.endpoint || config.endpoint.trim().length === 0)) {
      errors.push('Custom endpoint URL is required');
    }

    if (!config.model || config.model.trim().length === 0) {
      errors.push('Model name is required');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Disable AI (quick way to turn off AI features)
export function disableAI(): void {
  const config = getAIConfig();
  config.enabled = false;
  saveAIConfig(config);
}

// Enable AI (user must still configure provider and key)
export function enableAI(): void {
  const config = getAIConfig();
  config.enabled = true;
  saveAIConfig(config);
}

// Clear AI configuration (for privacy/reset)
export function clearAIConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Get provider-specific configuration hints
export function getProviderHints(provider: AIConfig['provider']): {
  name: string;
  description: string;
  apiKeyFormat: string;
  defaultEndpoint: string;
  models: string[];
} {
  switch (provider) {
    case 'openai':
      return {
        name: 'OpenAI',
        description: 'Use GPT models from OpenAI',
        apiKeyFormat: 'sk-...',
        defaultEndpoint: 'https://api.openai.com/v1/chat/completions',
        models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']
      };

    case 'anthropic':
      return {
        name: 'Anthropic',
        description: 'Use Claude models from Anthropic',
        apiKeyFormat: 'sk-ant-...',
        defaultEndpoint: 'https://api.anthropic.com/v1/messages',
        models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
      };

    case 'custom':
      return {
        name: 'Custom Provider',
        description: 'Use a custom AI API endpoint',
        apiKeyFormat: 'Your API key',
        defaultEndpoint: 'https://your-api.com/v1/completions',
        models: ['your-model-name']
      };

    default:
      return {
        name: 'No AI',
        description: 'Ghost Writer works perfectly without AI',
        apiKeyFormat: '',
        defaultEndpoint: '',
        models: []
      };
  }
}
