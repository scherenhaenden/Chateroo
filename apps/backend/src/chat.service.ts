import { Injectable } from '@nestjs/common';
import { EngineRegistryService } from './ai-engine/engine-registry.service';
import {
  ChatPayload,
  ChatResponse,
  StreamChunk,
} from './ai-engine/ai-api-engine.base';
import { OpenRouterEngine } from './ai-engine/domains/open-router/services/openrouter.engine';
import { OpenRouterModel } from './ai-engine/domains/open-router/interfaces/openrouter-model.interface';
import type { SendMessageDto } from './dtos/chat.dto';

@Injectable()
export class ChatService {
  constructor(private readonly engineRegistry: EngineRegistryService) {}

  private extractPromptFromPayload(payload: SendMessageDto): string {
    if (payload.messages) {
      return payload.messages.map((msg) => msg.content).join('\n');
    }
    return payload.prompt || '';
  }

  sendMessage(payload: SendMessageDto): Promise<ChatResponse> {
    const engine = this.engineRegistry.get(payload.provider);
    if (!engine) {
      throw new Error(`Provider ${payload.provider} not supported`);
    }

    // Verwende die neue Hilfsmethode zur Extraktion des Prompts
    const prompt = this.extractPromptFromPayload(payload);
    console.log('Extracted prompt from payload:', prompt);
    console.log('Original payload messages:', payload.messages);

    const chatPayload: ChatPayload = {
      prompt: prompt,
      apiKey: payload.apiKey,
      model: payload.model,
      attachments: payload.attachments || payload.messages?.[payload.messages.length - 1]?.attachments,
    };

    return engine.sendMessage(chatPayload);
  }

  async *sendMessageStream(
    payload: SendMessageDto,
  ): AsyncIterableIterator<StreamChunk> {
    const engine = this.engineRegistry.get(payload.provider);
    if (!engine) {
      yield {
        content: `Provider ${payload.provider} not supported`,
        done: true,
      };
      return;
    }

    // Convert messages array to prompt if needed
    const prompt = this.extractPromptFromPayload(payload);

    const chatPayload: ChatPayload = {
      prompt: prompt,
      apiKey: payload.apiKey,
      model: payload.model,
      attachments: payload.attachments || payload.messages?.[payload.messages.length - 1]?.attachments,
      stream: true,
    };

    // Use streaming if available, otherwise fall back to regular message
    if (engine.sendMessageStream) {
      yield* engine.sendMessageStream(chatPayload);
    } else {
      // Fallback for engines without streaming support
      const response = await engine.sendMessage(chatPayload);
      yield { content: response.content, done: true };
    }
  }

  /**
   * Gets available OpenRouter models
   */
  async getOpenRouterModels(apiKey?: string): Promise<OpenRouterModel[]> {
    const engine = this.engineRegistry.get('openrouter') as OpenRouterEngine;
    if (!engine) {
      throw new Error('OpenRouter engine not available');
    }

    // If no API key provided, try to get models with a temporary/demo key
    // or return an empty array with a message
    if (!apiKey) {
      try {
        // OpenRouter's public models endpoint doesn't require authentication
        // We'll use a minimal key or handle the request differently
        return await engine.listModels('');
      } catch (error) {
        console.log('No API key provided for OpenRouter models, returning empty list');
        return [];
      }
    }

    return await engine.listModels(apiKey);
  }

  /**
   * Gets available OpenRouter providers
   */
  async getOpenRouterProviders(): Promise<any[]> {
    const engine = this.engineRegistry.get('openrouter') as OpenRouterEngine;
    if (!engine) {
      throw new Error('OpenRouter engine not available');
    }

    return await engine.listProviders();
  }

  /**
   * Get all available AI providers configured in the system.
   * Returns a list of provider metadata including capabilities.
   */
  public async getAvailableProviders(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    requiresApiKey: boolean;
    supportsModels: boolean;
  }>> {
    const providers = this.engineRegistry.getAllProviders();

    return providers.map(provider => ({
      id: provider,
      name: this.getProviderDisplayName(provider),
      description: this.getProviderDescription(provider),
      requiresApiKey: this.providerRequiresApiKey(provider),
      supportsModels: this.providerSupportsModels(provider),
    }));
  }

  /**
   * Get models for specified providers, grouped by provider.
   * Returns an object where keys are provider IDs and values are arrays of models.
   */
  public async getModelsForProviders(
    providers: string[],
    apiKey?: string,
  ): Promise<Record<string, Array<{
    id: string;
    name: string;
    description?: string;
    context_length?: number;
    provider: string;
  }>>> {
    const result: Record<string, any[]> = {};

    for (const providerId of providers) {
      try {
        const models = await this.getModelsForProvider(providerId, apiKey);
        result[providerId] = models;
      } catch (error) {
        console.error(`Error fetching models for provider ${providerId}:`, error);
        result[providerId] = [];
      }
    }

    return result;
  }

  /**
   * Get models for a single provider.
   * Different providers have different model discovery mechanisms.
   */
  private async getModelsForProvider(
    providerId: string,
    apiKey?: string,
  ): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    context_length?: number;
    provider: string;
  }>> {
    const engine = this.engineRegistry.get(providerId);
    if (!engine) {
      throw new Error(`Provider ${providerId} not found`);
    }

    switch (providerId) {
      case 'openrouter':
        const openRouterEngine = engine as OpenRouterEngine;
        const openRouterModels = await openRouterEngine.listModels(apiKey || '');
        return openRouterModels.map(model => ({
          id: model.id,
          name: model.name,
          description: model.description,
          context_length: model.context_length,
          provider: 'openrouter',
        }));

      case 'openai':
        // OpenAI doesn't have a public models API, return static list
        return this.getOpenAIModels().map(model => ({
          ...model,
          provider: 'openai',
        }));

      case 'lm-studio':
        // LM Studio uses local models, could potentially query the local API
        return this.getLMStudioModels().map(model => ({
          ...model,
          provider: 'lm-studio',
        }));

      case 'mistral':
        return this.getMistralModels().map(model => ({
          ...model,
          provider: 'mistral',
        }));

      case 'gemini':
        return this.getGeminiModels().map(model => ({
          ...model,
          provider: 'gemini',
        }));

      case 'perplexity':
        return this.getPerplexityModels().map(model => ({
          ...model,
          provider: 'perplexity',
        }));

      case 'grok':
        return this.getGrokModels().map(model => ({
          ...model,
          provider: 'grok',
        }));

      case 'deepseek':
        return this.getDeepSeekModels().map(model => ({
          ...model,
          provider: 'deepseek',
        }));

      default:
        return [];
    }
  }

  /**
   * Helper methods for provider metadata
   */
  private getProviderDisplayName(provider: string): string {
    const names: Record<string, string> = {
      'lm-studio': 'LM Studio',
      'openai': 'OpenAI',
      'openrouter': 'OpenRouter',
      'mistral': 'Mistral AI',
      'gemini': 'Google Gemini',
      'perplexity': 'Perplexity',
      'grok': 'Grok (xAI)',
      'deepseek': 'DeepSeek',
      'dummy': 'Dummy Provider',
    };
    return names[provider] || provider.charAt(0).toUpperCase() + provider.slice(1);
  }

  private getProviderDescription(provider: string): string {
    const descriptions: Record<string, string> = {
      'lm-studio': 'Local AI models via LM Studio',
      'openai': 'OpenAI GPT models',
      'openrouter': 'Multiple AI providers via OpenRouter',
      'mistral': 'Mistral AI language models',
      'gemini': 'Google Gemini AI models',
      'perplexity': 'Perplexity AI search-augmented models',
      'grok': 'Grok AI models by xAI',
      'deepseek': 'DeepSeek AI models',
      'dummy': 'Dummy provider for testing',
    };
    return descriptions[provider] || `${provider} AI provider`;
  }

  private providerRequiresApiKey(provider: string): boolean {
    const requiresKey = ['openai', 'openrouter', 'mistral', 'gemini', 'perplexity', 'grok', 'deepseek'];
    return requiresKey.includes(provider);
  }

  private providerSupportsModels(provider: string): boolean {
    // Most providers support model selection, dummy and lm-studio might not
    return provider !== 'dummy';
  }

  /**
   * Static model lists for providers that don't have dynamic model APIs
   */
  private getOpenAIModels() {
    return [
      { id: 'gpt-4o', name: 'GPT-4o', description: 'Latest GPT-4 Omni model', context_length: 128000 },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Faster, cheaper GPT-4o', context_length: 128000 },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Latest GPT-4 Turbo model', context_length: 128000 },
      { id: 'gpt-4', name: 'GPT-4', description: 'Standard GPT-4 model', context_length: 8192 },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and efficient model', context_length: 16385 },
    ];
  }

  private getLMStudioModels() {
    return [
      { id: 'local-model', name: 'Local Model', description: 'Currently loaded local model', context_length: 4096 },
    ];
  }

  private getMistralModels() {
    return [
      { id: 'mistral-large', name: 'Mistral Large', description: 'Most capable Mistral model', context_length: 32000 },
      { id: 'mistral-medium', name: 'Mistral Medium', description: 'Balanced Mistral model', context_length: 32000 },
      { id: 'mistral-small', name: 'Mistral Small', description: 'Fast Mistral model', context_length: 32000 },
    ];
  }

  private getGeminiModels() {
    return [
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Latest Gemini Pro model', context_length: 1000000 },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast Gemini model', context_length: 1000000 },
      { id: 'gemini-pro', name: 'Gemini Pro', description: 'Gemini Pro model', context_length: 32000 },
    ];
  }

  private getPerplexityModels() {
    return [
      { id: 'llama-3.1-sonar-large-128k-online', name: 'Llama 3.1 Sonar Large (Online)', description: 'Large online model', context_length: 127072 },
      { id: 'llama-3.1-sonar-small-128k-online', name: 'Llama 3.1 Sonar Small (Online)', description: 'Small online model', context_length: 127072 },
    ];
  }

  private getGrokModels() {
    return [
      { id: 'grok-beta', name: 'Grok Beta', description: 'Grok AI model', context_length: 131072 },
    ];
  }

  private getDeepSeekModels() {
    return [
      { id: 'deepseek-chat', name: 'DeepSeek Chat', description: 'DeepSeek conversational model', context_length: 32000 },
      { id: 'deepseek-coder', name: 'DeepSeek Coder', description: 'DeepSeek coding model', context_length: 32000 },
    ];
  }
}
