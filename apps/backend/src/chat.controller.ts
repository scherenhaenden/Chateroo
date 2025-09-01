import { Controller, Post, Body, Res, Headers, Get, Query } from '@nestjs/common';
import type { Response } from 'express';
import { ChatService } from './chat.service';

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

export interface SendMessageDto {
  provider: string;
  messages?: ChatMessage[]; // New format with conversation history
  prompt?: string; // Legacy format for backward compatibility
  apiKey?: string;
  model?: string;
  stream?: boolean;
  attachments?: {
    name: string;
    type: string;
    base64: string;
    size: number;
  }[];
}

@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async sendMessage(
    @Body() payload: SendMessageDto,
    @Res() res: Response,
    @Headers('accept') accept?: string,
  ) {
    console.log('Received payload:', payload);

    const isStream = payload.stream || accept?.includes('text/event-stream');

    if (isStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      (res as any).flushHeaders?.();

      try {
        for await (const chunk of this.chatService.sendMessageStream(payload)) {
          if (chunk.content) {
            res.write(
              `data: ${JSON.stringify({ content: chunk.content })}\n\n`,
            );
          }
          if (chunk.done) {
            res.write('data: [DONE]\n\n');
            break;
          }
        }
      } catch (error) {
        console.error('Error in chat controller:', error);
        res.write(
          `data: ${JSON.stringify({ error: 'An error occurred while processing your request' })}\n\n`,
        );
      } finally {
        res.end();
      }
      return;
    }

    try {
      const result = await this.chatService.sendMessage(payload);
      res.json(result);
    } catch (error) {
      console.error('Error in chat controller:', error);
      res.status(500).json({
        error: 'An error occurred while processing your request',
        details: error.message,
      });
    }
  }

  /**
   * Fetches OpenRouter models based on the provided API key.
   *
   * This function makes an asynchronous call to the chatService's getOpenRouterModels method, passing the apiKey as an argument.
   * It handles any potential errors by logging them to the console and rethrowing the error for further handling.
   *
   * @param {string} [apiKey] - The API key used to authenticate the request.
   */
  @Get('openrouter/models')
  async getOpenRouterModels(@Query('apiKey') apiKey?: string) {
    try {
      return await this.chatService.getOpenRouterModels(apiKey);
    } catch (error) {
      console.error('Error fetching OpenRouter models:', error);
      throw error;
    }
  }
}
