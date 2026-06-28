const axios = require('axios');

// OpenAI-compatible endpoints for each provider
const PROVIDER_ENDPOINTS = {
    openai:   'https://api.openai.com/v1/chat/completions',
    groq:     'https://api.groq.com/openai/v1/chat/completions',
    google:   'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    mistral:  'https://api.mistral.ai/v1/chat/completions',
    together: 'https://api.together.xyz/v1/chat/completions',
    aichixia: 'https://www.aichixia.xyz/api/v1/chat/completions',
};

// Legacy aichixia model registry — used when no admin provider is configured
const MODEL_REGISTRY = [
    { id: 'gemini-3-flash',             name: 'Gemini 3 Flash',       tier: 'free',     description: 'Fast multimodal model, 1M context' },
    { id: 'gpt-oss-120b',               name: 'GPT-OSS 120B',          tier: 'free',     description: 'Large open-source with web search' },
    { id: 'mimo-v2-flash',              name: 'MiMo V2 Flash',         tier: 'free',     description: '309B MoE, reasoning & coding' },
    { id: 'phi-4-multimodal-instruct',  name: 'Phi 4 Multimodal',      tier: 'free',     description: 'Microsoft compact, vision & audio' },
    { id: 'copilot',                    name: 'Microsoft Copilot',      tier: 'free',     description: 'Web search, document analysis' },
    { id: 'aichixia-flash',             name: 'Aichixia 114B Flash',   tier: 'standard', description: '28B active params MoE, real-time' },
    { id: 'deepseek-v4-flash',          name: 'DeepSeek V4 Flash',     tier: 'standard', description: '1M context, multi-purpose' },
    { id: 'glm-4.7-flash',              name: 'GLM 4.7 Flash',         tier: 'standard', description: 'Ultra-fast, general purpose' },
    { id: 'llama-3.3-70b',              name: 'Llama 3.3 70B',         tier: 'standard', description: 'Efficient open-source powerhouse' },
    { id: 'wormgpt-v4',                 name: 'WormGPT V4',            tier: 'standard', description: 'Privacy-first, deep reasoning' },
    { id: 'groq-compound',              name: 'Groq Compound',         tier: 'standard', description: 'Multi-model agentic system' },
    { id: 'cohere-command-a',           name: 'Cohere Command A',      tier: 'standard', description: 'Enterprise RAG, excellent tool use' },
    { id: 'grok-3',                     name: 'Grok 3',                tier: 'premium',  description: 'xAI flagship, real-time data, 1M context' },
    { id: 'deepseek-v3.2',              name: 'DeepSeek V3.2',         tier: 'premium',  description: 'Deep reasoning and code generation' },
    { id: 'grok-4-fast',                name: 'Grok 4 Fast',           tier: 'premium',  description: 'Ultra-low latency, 2M context' },
];

const DEFAULT_MODEL = 'glm-4.7-flash';

// Read admin-selected model from SystemSettings (legacy aichixia model picker)
const getActiveModel = async () => {
    try {
        const SystemSettings = require('../models/SystemSettings');
        const s = await SystemSettings.findOne({ key: 'ai_model' });
        if (s?.value && MODEL_REGISTRY.some(m => m.id === s.value)) return s.value;
    } catch { /* ignore */ }
    return DEFAULT_MODEL;
};

// Read admin-configured providers from SystemSettings
const getActiveAdminProvider = async () => {
    try {
        const SystemSettings = require('../models/SystemSettings');
        const s = await SystemSettings.findOne({ key: 'ai_providers' });
        if (!s?.value) return null;
        const providers = JSON.parse(s.value);
        return providers.find(p => p.isActive) || null;
    } catch { return null; }
};

/**
 * Core AI call.
 * Priority: userConfig (from request headers) → admin provider → env var (aichixia)
 *
 * @param {Array}  messages   - OpenAI-format messages array
 * @param {Object} options    - { temperature, max_tokens, model }
 * @param {Object} userConfig - { provider, apiKey, model, baseUrl } from request headers, or null
 */
const callAI = async (messages, options = {}, userConfig = null) => {
    const { temperature = 0.7, max_tokens = 2000 } = options;

    let endpoint, apiKey, model;

    if (userConfig?.apiKey) {
        // User's own provider key
        const provider = userConfig.provider || 'groq';
        if (provider === 'custom' && userConfig.baseUrl) {
            endpoint = `${userConfig.baseUrl.replace(/\/$/, '')}/chat/completions`;
        } else {
            endpoint = PROVIDER_ENDPOINTS[provider] || PROVIDER_ENDPOINTS.aichixia;
        }
        apiKey = userConfig.apiKey;
        model  = userConfig.model || DEFAULT_MODEL;
        console.log(`[AI] Using user config: provider=${provider} model=${model}`);
    } else {
        // Try admin-configured provider
        const adminProvider = await getActiveAdminProvider();
        if (adminProvider?.apiKey) {
            const p = adminProvider.provider || 'aichixia';
            if (p === 'custom' && adminProvider.baseUrl) {
                endpoint = `${adminProvider.baseUrl.replace(/\/$/, '')}/chat/completions`;
            } else {
                endpoint = PROVIDER_ENDPOINTS[p] || PROVIDER_ENDPOINTS.aichixia;
            }
            apiKey = adminProvider.apiKey;
            model  = options.model || adminProvider.defaultModel || DEFAULT_MODEL;
            console.log(`[AI] Using admin provider: ${adminProvider.name} model=${model}`);
        } else {
            // Fall back to legacy env var + aichixia
            endpoint = PROVIDER_ENDPOINTS.aichixia;
            apiKey   = process.env.AICHIXIA_API_KEY;
            model    = options.model || (await getActiveModel());
            if (!apiKey) throw new Error('No AI API key configured. Add one in Admin → AI Providers, or set AICHIXIA_API_KEY.');
            console.log(`[AI] Using env AICHIXIA_API_KEY model=${model}`);
        }
    }

    const makeRequest = async (m) => {
        const res = await axios.post(endpoint, { model: m, messages, temperature, max_tokens }, {
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            timeout: 60000,
        });
        const content = res.data?.choices?.[0]?.message?.content;
        if (!content) throw new Error(`Empty response from model ${m}`);
        return content;
    };

    try {
        const result = await makeRequest(model);
        console.log(`[AI] ✓ ${model}`);
        return result;
    } catch (err) {
        const status = err.response?.status;
        const errBody = err.response?.data;
        console.error(`[AI] ✗ ${model} | status=${status} |`, JSON.stringify(errBody)?.slice(0, 200));

        if (status === 401) throw new Error('AI authentication failed — check your API key.');

        // Only fall back when using system key (not user's own key)
        if (!userConfig?.apiKey) {
            const fallback = model !== DEFAULT_MODEL ? DEFAULT_MODEL : 'gpt-oss-120b';
            console.warn(`[AI] Falling back to ${fallback}`);
            try {
                const result = await makeRequest(fallback);
                console.log(`[AI] ✓ fallback ${fallback}`);
                return result;
            } catch (fbErr) {
                const fbStatus = fbErr.response?.status;
                if (fbStatus === 401) throw new Error('AI authentication failed — check your API key.');
                const msg = fbErr.response?.data?.error?.message || fbErr.message || 'AI request failed';
                throw new Error(msg);
            }
        }
        const msg = errBody?.error?.message || err.message || 'AI request failed';
        throw new Error(msg);
    }
};

const generateBrainstormNotes = async (transcript, videoTitle, userConfig = null) => {
    const fullText = transcript.map(t => t.text).join(' ');
    const prompt = `
You are an expert learning assistant. I am watching a video titled: "${videoTitle}".

Process the transcript and provide a structured study plan:

### 1. 🎯 Executive Summary
(Summarize the core message in 2-3 powerful sentences)

### 2. 🚀 Step-by-Step Roadmap
(Break down the process or concepts. Use Markdown Tables for comparative data.)

### 3. 🧠 Brainstorming Lab
(3-5 thought-provoking questions or application ideas.)

### 4. ✅ Actionable Next Steps
(A clear checklist of what to do right now.)

Use Markdown Tables for traces. Use emojis for visual clarity. Keep sentences concise.

Transcript:
${fullText.slice(0, 10000)} ...
`;
    try {
        return await callAI([
            { role: 'system', content: 'You are a helpful learning assistant that converts video transcripts into structured brainstorming plans.' },
            { role: 'user', content: prompt }
        ], { temperature: 0.7, max_tokens: 2000 }, userConfig);
    } catch (err) {
        console.error('AI Brainstorm Error:', err.message);
        throw new Error(err.message || 'Failed to generate brainstorming notes.');
    }
};

const chatWithVideo = async (videoTitle, transcriptSegments, message, chatHistory = [], brainstormPlan = '', userConfig = null) => {
    const transcriptText = transcriptSegments.map(t => t.text).join(' ');
    const systemPrompt = `
You are the "Master Academic Tutor" for the video: "${videoTitle}".

PERSONALITY: Insightful, encouraging, highly intellectual. Explain the 'Why'. Use analogies.

CONTEXT:
1. Brainstorming Roadmap:
${brainstormPlan || "No roadmap available. Rely on transcript."}

2. Video Transcript:
${transcriptText.slice(0, 8000)} ...

GUIDELINES: Use Markdown Tables for traces. Never truncate thoughts. Encourage active learning.
`;
    try {
        return await callAI([
            { role: 'system', content: systemPrompt },
            ...chatHistory,
            { role: 'user', content: message }
        ], { temperature: 0.8, max_tokens: 2000 }, userConfig);
    } catch (err) {
        console.error('AI Chat Error:', err.message);
        throw new Error(err.message || 'Failed to get AI response');
    }
};

module.exports = {
    callAI,
    getActiveModel,
    getActiveAdminProvider,
    generateBrainstormNotes,
    chatWithVideo,
    MODEL_REGISTRY,
    DEFAULT_MODEL,
    PROVIDER_ENDPOINTS,
};
