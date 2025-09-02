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
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
      (res as any).flushHeaders?.();

      try {
        const stream = this.chatService.sendMessageStream(payload);

        for await (const chunk of stream) {
          if (chunk.done) {
            res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
            break;
          } else {
            res.write(
              `data: ${JSON.stringify({
                type: 'content',
                content: chunk.content,
              })}\n\n`,
            );
          }
        }
      } catch (error) {
        res.write(
          `data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`,
        );
      } finally {
        res.end();
      }
    } else {
      // Regular non-streaming response
      try {
        const response = await this.chatService.sendMessage(payload);
        res.json(response);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  }

  @Get('openrouter/models')
  async getOpenRouterModels(@Query('apiKey') apiKey?: string) {
    try {
      return await this.chatService.getOpenRouterModels(apiKey);
    } catch (error) {
      console.error('Error fetching OpenRouter models:', error);
      throw error;
    }
  }

  @Get('openrouter/providers')
  async getOpenRouterProviders() {
    try {
      return await this.chatService.getOpenRouterProviders();
    } catch (error) {
      console.error('Error fetching OpenRouter providers:', error);
      throw error;
    }
  }
}
