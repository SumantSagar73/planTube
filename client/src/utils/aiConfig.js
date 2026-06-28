// Provider metadata — used by both Profile settings and admin panel
export const AI_PROVIDERS = [
    { id: 'groq',     name: 'Groq',               baseUrl: 'https://api.groq.com/openai/v1',                           placeholder: 'gsk_...',      models: ['llama-3.3-70b-versatile', 'llama3-70b-8192', 'mixtral-8x7b-32768', 'gemma2-9b-it'] },
    { id: 'openai',   name: 'OpenAI',              baseUrl: 'https://api.openai.com/v1',                                placeholder: 'sk-...',       models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
    { id: 'google',   name: 'Google Gemini',       baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', placeholder: 'AIza...',      models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'] },
    { id: 'mistral',  name: 'Mistral',             baseUrl: 'https://api.mistral.ai/v1',                               placeholder: 'mis-...',      models: ['mistral-large-latest', 'mistral-medium-latest', 'open-mixtral-8x22b'] },
    { id: 'together', name: 'Together AI',         baseUrl: 'https://api.together.xyz/v1',                             placeholder: 'tog-...',      models: ['meta-llama/Llama-3-70b-chat-hf', 'mistralai/Mixtral-8x22B-Instruct-v0.1'] },
    { id: 'aichixia', name: 'Aichixia (Default)',  baseUrl: 'https://www.aichixia.xyz/api/v1',                         placeholder: 'acv-...',      models: ['glm-4.7-flash', 'grok-3', 'deepseek-v3.2', 'llama-3.3-70b'] },
    { id: 'custom',   name: 'Custom (OpenAI-compatible)', baseUrl: '',                                                  placeholder: 'Bearer token', models: [] },
];

export const getProviderById = (id) => AI_PROVIDERS.find(p => p.id === id) || AI_PROVIDERS[0];

// ── User config stored in localStorage ────────────────────────────────────────

const STORAGE_KEY = 'plantube_ai_config';

export const getUserAIConfig = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;
        const parsed = JSON.parse(stored);
        return parsed?.apiKey ? parsed : null;
    } catch { return null; }
};

export const setUserAIConfig = (config) => {
    if (config?.apiKey?.trim()) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } else {
        localStorage.removeItem(STORAGE_KEY);
    }
};

export const clearUserAIConfig = () => localStorage.removeItem(STORAGE_KEY);

// Returns headers to attach to AI-related API requests.
// Backend reads these and uses the user's key instead of the system key.
export const getAIHeaders = () => {
    const config = getUserAIConfig();
    if (!config?.apiKey) return {};
    const provider = getProviderById(config.provider || 'groq');
    const baseUrl = config.provider === 'custom' ? (config.baseUrl || '') : provider.baseUrl;
    return {
        'x-ai-provider': config.provider || 'groq',
        'x-ai-key':      config.apiKey,
        'x-ai-model':    config.model || '',
        'x-ai-url':      baseUrl,
    };
};
