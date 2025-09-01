import { Injectable } from '@nestjs/common';
import { EngineRegistryService } from './ai-engine/engine-registry.service';
import {
  ChatPayload,
  ChatResponse,
  StreamChunk,
} from './ai-engine/ai-api-engine.base';
import { OpenRouterEngine, OpenRouterModel } from './ai-engine/openrouter.engine';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: {
    name: string;
    type: string;
    base64: string;
    size: number;
  }[];
}

export interface ChatServicePayload {
  provider: string;
  messages?: ChatMessage[]; // New format with conversation history
  prompt?: string;          // Legacy format for backward compatibility
  apiKey?: string;
  model?: string;
  attachments?: {
    name: string;
    type: string;
    base64: string;
    size: number;
  }[];
}

@Injectable()
export class ChatService {
  constructor(private readonly engineRegistry: EngineRegistryService) {}

  sendMessage(payload: ChatServicePayload): Promise<ChatResponse> {
    const engine = this.engineRegistry.get(payload.provider);
    if (!engine) {
      throw new Error(`Provider ${payload.provider} not supported`);
    }

    // Convert messages array to prompt if needed
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
    payload: ChatServicePayload,
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
   * Extracts a prompt from the payload, supporting both new messages format and legacy prompt format
   */
  private extractPromptFromPayload(payload: ChatServicePayload): string {
    // If we have messages array (new format), convert to conversational prompt
    if (payload.messages && payload.messages.length > 0) {
      return this.convertMessagesToConversationalPrompt(payload.messages);
    }

    // Fallback to legacy prompt format
    if (payload.prompt) {
      return payload.prompt;
    }

    throw new Error('No prompt or messages provided');
  }

  /**
   * Converts messages array to a conversational prompt that includes context
   */
  private convertMessagesToConversationalPrompt(messages: ChatMessage[]): string {
    let conversationalPrompt = '';

    // Add system messages first
    const systemMessages = messages.filter(msg => msg.role === 'system');
    if (systemMessages.length > 0) {
      conversationalPrompt += systemMessages.map(msg => msg.content).join('\n') + '\n\n';
    }

    // Add conversation history
    const conversationMessages = messages.filter(msg => msg.role !== 'system');

    if (conversationMessages.length > 1) {
      conversationalPrompt += 'Previous conversation:\n';
      // Include all but the last message as context
      for (let i = 0; i < conversationMessages.length - 1; i++) {
        const msg = conversationMessages[i];
        if (msg.role === 'user') {
          conversationalPrompt += `User: ${msg.content}\n`;
        } else if (msg.role === 'assistant') {
          conversationalPrompt += `Assistant: ${msg.content}\n`;
        }
      }
      conversationalPrompt += '\nCurrent question:\n';
    }

    // Add the current user message
    const lastMessage = conversationMessages[conversationMessages.length - 1];
    if (lastMessage && lastMessage.role === 'user') {
      conversationalPrompt += lastMessage.content;
    }

    return conversationalPrompt;
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
}
