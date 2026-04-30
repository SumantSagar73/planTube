const axios = require('axios');

const AICHIXIA_ENDPOINT = 'https://www.aichixia.xyz/api/v1';
const AICHIXIA_API_KEY = process.env.AICHIXIA_API_KEY;

// Primary and backup models
const PRIMARY_MODEL = 'gemini-flash-3';
const BACKUP_MODEL = 'gpt-5';

/**
 * Makes an AI API call with automatic fallback from primary to backup model
 */
const callAI = async (messages, options = {}) => {
    const { temperature = 0.7, max_tokens = 2000 } = options;

    // Try primary model first
    try {
        const response = await axios.post(`${AICHIXIA_ENDPOINT}/chat/completions`, {
            model: PRIMARY_MODEL,
            messages,
            temperature,
            max_tokens
        }, {
            headers: {
                'Authorization': `Bearer ${AICHIXIA_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
        console.log(`[AI] Response from ${PRIMARY_MODEL}`);
        return response.data.choices[0].message.content;
    } catch (primaryError) {
        console.warn(`[AI] ${PRIMARY_MODEL} failed: ${primaryError.response?.data?.error?.message || primaryError.message}. Falling back to ${BACKUP_MODEL}...`);

        // Fallback to backup model
        const response = await axios.post(`${AICHIXIA_ENDPOINT}/chat/completions`, {
            model: BACKUP_MODEL,
            messages,
            temperature,
            max_tokens
        }, {
            headers: {
                'Authorization': `Bearer ${AICHIXIA_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 45000
        });
        console.log(`[AI] Response from ${BACKUP_MODEL} (fallback)`);
        return response.data.choices[0].message.content;
    }
};

/**
 * Generates structured notes and brainstorming steps from a video transcript
 */
const generateBrainstormNotes = async (transcript, videoTitle) => {
    const fullText = transcript.map(t => t.text).join(' ');

    const prompt = `
You are an expert learning assistant and brainstorming partner. 
I am watching a video titled: "${videoTitle}".

Below is the transcript of the video. Please process it and provide a structured plan to help me:

### 1. 🎯 Executive Summary
(Summarize the core message in 2-3 powerful sentences)

### 2. 🚀 Step-by-Step Roadmap
(Break down the process or concepts. Use Markdown Tables for comparative data or execution traces if helpful.)

### 3. 🧠 Brainstorming Lab
(Provide 3-5 thought-provoking questions or application ideas.)

### 4. ✅ Actionable Next Steps
(A clear checklist of what I should do right now.)

**Formatting Rules:**
- Use Markdown Tables for dry-runs or traces.
- Use vertical lists or bold blocks for general structure.
- Use emojis to make it look premium and engaging.
- Keep sentences concise but impactful.

Transcript:
${fullText.slice(0, 10000)} ...
`;

    try {
        return await callAI([
            { role: 'system', content: 'You are a helpful learning assistant that converts video transcripts into structured brainstorming plans.' },
            { role: 'user', content: prompt }
        ], { temperature: 0.7, max_tokens: 2000 });
    } catch (error) {
        console.error('AI Generation Error (both models failed):', error.response?.data || error.message);
        throw new Error('Failed to generate brainstorming notes.');
    }
};

/**
 * Chat with the video content - Optimized for token efficiency
 */
const chatWithVideo = async (videoTitle, transcriptSegments, message, chatHistory = [], brainstormPlan = '') => {
    const transcriptText = transcriptSegments.map(t => t.text).join(' ');

    const systemPrompt = `
You are the "Master Academic Tutor" for the video: "${videoTitle}".

### YOUR PERSONALITY & TONE:
- You are **insightful, encouraging, and highly intellectual**.
- You don't just give answers; you **explain concepts** so the user truly understands.
- Use analogies when helpful to clarify complex ideas.
- Think like a professor who is passionate about the subject.

### CONTEXT (Your Knowledge Base):
1. **Brainstorming Roadmap**:
${brainstormPlan || "No roadmap available. Rely on transcript logic."}

2. **Video Transcript (Key Details)**:
${transcriptText.slice(0, 8000)} ...

### YOUR PEDAGOGICAL MISSION:
1. **Explain the 'Why'**: Explain the underlying logic clearly.
2. **Contextual Linking**: Connect answers back to the Roadmap.
3. **Structured Depth**: Always provide **full, non-truncated** explanations.
4. **Dry-Runs & Traces**: When explaining logic, **MANDATORY: Use Markdown Tables** for step-by-step traces.
5. **Active Learning**: Encourage the user to apply the concept.

### FORMATTING GUIDELINES:
- **Rich Markdown**: Use bolding, headers, and code blocks.
- **GFM Tables**: Use tables for variable traces and comparisons.
- **Visual Spacing**: Use ample line breaks.
- **Completeness**: Never truncate a thought.
`;

    try {
        return await callAI([
            { role: 'system', content: systemPrompt },
            ...chatHistory,
            { role: 'user', content: message }
        ], { temperature: 0.8, max_tokens: 2000 });
    } catch (error) {
        console.error('AI Chat Error (both models failed):', error.response?.data || error.message);
        throw new Error('Failed to get AI response');
    }
};

module.exports = { 
    generateBrainstormNotes,
    chatWithVideo
};
