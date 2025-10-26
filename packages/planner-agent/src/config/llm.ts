import { LLMConfig } from '@clear-ai/shared';

// Check which API key is available to determine provider
const hasGroqKey = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith('gsk_');
const hasOpenAIKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-');

// Prefer Groq if available since it's free
const provider = hasGroqKey ? 'groq' : (hasOpenAIKey ? 'openai' : 'groq');
const model = process.env.LLM_MODEL || (
  provider === 'openai' ? 'gpt-4o-mini' : 'llama-3.1-8b-instant'
);

console.log('Selected provider:', provider, 'Model:', model);

export const LLM_CONFIG: LLMConfig = {
  provider: provider as 'groq' | 'openai',
  model,
  temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
  max_tokens: parseInt(process.env.LLM_MAX_TOKENS || '2000', 10),
};

console.log('LLM Configuration:', LLM_CONFIG);
