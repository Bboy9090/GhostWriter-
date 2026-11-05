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
const SESSION_KEY = 'ghostwriter:ai-session-key';

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
    const parsed = stored ? JSON.parse(stored) as Partial<AIConfig> : {};
    // Migrate legacy persistent settings without retaining a previously saved secret.
    // The user must enter their BYOK token again after this upgrade.
    if (stored && Object.prototype.hasOwnProperty.call(parsed, 'apiKey')) {
      const { apiKey: _discard, ...preferences } = parsed;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    }
    const { apiKey: _legacy, ...safePreferences } = parsed;
    return { ...DEFAULT_CONFIG, ...safePreferences, apiKey: sessionStorage.getItem(SESSION_KEY) || '' };
  } catch (error) {
    console.error('Error loading AI config:', error);
    return { ...DEFAULT_CONFIG };
  }
}

// Save nonsecret preferences persistently; keep the BYOK token in this tab's
// session only. sessionStorage survives reloads but not normal tab closure.
export function saveAIConfig(config: AIConfig): void {
  try {
    const { apiKey, ...preferences } = config;
    if (apiKey.trim()) sessionStorage.setItem(SESSION_KEY, apiKey.trim());
    else sessionStorage.removeItem(SESSION_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
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

// Apply an AI action through the configured GhostWriter backend.
// The OpenAI key is sent only with this explicit request and is not persisted by the backend.
export async function applyAIAction(
  actionId: string,
  text: string
): Promise<{ success: boolean; result?: string; error?: string; model?: string }> {
  const config = getAIConfig();

  if (!config.enabled || config.provider !== 'openai' || !config.apiKey.trim()) {
    return {
      success: false,
      error: 'Configure OpenAI BYOK in AI settings before using AI writing.'
    };
  }

  const action = getAIAction(actionId);
  if (!action) return { success: false, error: 'Invalid AI action' };
  if (!text.trim()) return { success: false, error: 'There is no text to send.' };
  if (!config.model.trim()) return { success: false, error: 'Choose an OpenAI model in AI settings.' };

  const configuredBase = (import.meta.env.VITE_GHOSTWRITER_API_URL || import.meta.env.VITE_API_URL || '').trim();
  if (!configuredBase) {
    return {
      success: false,
      error: 'GhostWriter AI backend is not configured for this build.'
    };
  }

  try {
    const response = await fetch(`${configuredBase.replace(/\/$/, '')}/ai/write`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${config.apiKey.trim()}`
      },
      body: JSON.stringify({
        action: actionId,
        text,
        model: config.model.trim()
      })
    });

    const body = await response.json().catch(() => ({})) as {
      ok?: boolean;
      text?: string;
      model?: string;
      error?: string;
    };

    if (!response.ok || !body.ok || !body.text) {
      return {
        success: false,
        error: body.error || `AI request failed (${response.status})`
      };
    }

    return { success: true, result: body.text, model: body.model };
  } catch (error) {
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
    } else if (config.provider !== 'openai') {
      errors.push('This build supports OpenAI BYOK only; other providers are not connected to the writing endpoint');
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
  sessionStorage.removeItem(SESSION_KEY);
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
        models: ['gpt-6-luna', 'gpt-6.1-sol']
      };

    case 'anthropic':
      return {
        name: 'Anthropic',
        description: 'Not connected to this build; AI writing currently supports OpenAI BYOK only',
        apiKeyFormat: 'sk-ant-...',
        defaultEndpoint: 'https://api.anthropic.com/v1/messages',
        models: []
      };

    case 'custom':
      return {
        name: 'Custom Provider',
        description: 'Custom endpoints are not connected to this build',
        apiKeyFormat: 'Your API key',
        defaultEndpoint: 'https://your-api.com/v1/completions',
        models: []
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
