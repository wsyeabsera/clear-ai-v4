import Groq from 'groq-sdk';
import OpenAI from 'openai';

export interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

export interface LLMConfig {
  provider: 'groq' | 'openai';
  model: string;
  temperature?: number;
  max_tokens?: number;
}

export class LLMService {
  private groqClient?: Groq;
  private openaiClient?: OpenAI;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;

    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith('gsk_')) {
      this.groqClient = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      });
      console.log('✓ Groq client initialized');
    }

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
      this.openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      console.log('✓ OpenAI client initialized');
    }
    
    if (!this.groqClient && !this.openaiClient) {
      console.warn('⚠️  No valid LLM API keys found. Set GROQ_API_KEY or OPENAI_API_KEY in .env');
    }
  }

  async analyzeQuery(
    query: string,
    tools: Array<{ name: string; description: string; parameters: Record<string, any> }>,
    systemPrompt: string
  ): Promise<string> {
    const toolsDescription = this.formatToolsForPrompt(tools);
    
    const prompt = `${systemPrompt}

Available Tools:
${toolsDescription}

User Query: "${query}"

Analyze this query and respond with JSON only. No markdown, no explanation, just valid JSON.`;

    try {
      const response = await this.callLLM(prompt);
      return response.content;
    } catch (error) {
      console.error('LLM Analysis Error:', error);
      throw error;
    }
  }

  private async callLLM(prompt: string): Promise<LLMResponse> {
    const { provider, model, temperature = 0.7, max_tokens = 2000 } = this.config;

    // Try primary provider first, fallback to secondary
    if (provider === 'groq') {
      if (this.groqClient) {
        try {
          const response = await this.groqClient.chat.completions.create({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature,
            max_tokens,
            response_format: { type: 'json_object' },
          });

          return {
            content: response.choices[0]?.message?.content || '',
            usage: response.usage,
          };
        } catch (error) {
          console.error('Groq error, falling back to OpenAI:', error);
          if (this.openaiClient) {
            return this.callOpenAI(prompt, model, temperature, max_tokens);
          }
          throw error;
        }
      }
    }

    if (provider === 'openai' || !this.groqClient) {
      if (this.openaiClient) {
        return this.callOpenAI(prompt, model, temperature, max_tokens);
      }
    }

    // Check which clients are actually available
    if (!this.groqClient && !this.openaiClient) {
      throw new Error('No LLM provider available. Please set GROQ_API_KEY or OPENAI_API_KEY in .env file');
    }
    
    // If we have a client but got here, there's a logic error
    throw new Error(`LLM client initialization failed. Available: Groq=${!!this.groqClient}, OpenAI=${!!this.openaiClient}`);
  }

  private async callOpenAI(
    prompt: string,
    model: string,
    temperature: number,
    max_tokens: number
  ): Promise<LLMResponse> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    const response = await this.openaiClient.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens,
      response_format: { type: 'json_object' },
    });

    return {
      content: response.choices[0]?.message?.content || '',
      usage: response.usage,
    };
  }

  private formatToolsForPrompt(
    tools: Array<{ name: string; description: string; parameters: Record<string, any> }>
  ): string {
    return tools
      .map((tool) => {
        const params = Object.entries(tool.parameters)
          .map(([key, value]) => {
            const required = value.required ? ' (required)' : ' (optional)';
            return `  - ${key}: ${typeof value.type === 'string' ? value.type : 'string'}${required}`;
          })
          .join('\n');

        return `
${tool.name}:
  Description: ${tool.description}
  Parameters:
${params}`;
      })
      .join('\n');
  }

  static getDefaultConfig(): LLMConfig {
    return {
      provider: 'groq',
      model: 'llama-3.1-70b-versatile',
      temperature: 0.7,
      max_tokens: 2000,
    };
  }
}
