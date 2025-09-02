import { Controller, Post, Body, Res, Header, Get, Query } from '@nestjs/common';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { ChatPayload } from './ai-engine/ai-api-engine.base';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  async sendMessage(@Body() payload: ChatPayload) {
    return await this.chatService.sendMessage(payload);
  }

  @Post('stream')
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  @Header('Access-Control-Allow-Origin', '*')
  @Header('Access-Control-Allow-Headers', 'Cache-Control')
  async streamMessage(
    @Body() payload: ChatPayload,
    @Res() response: Response,
  ) {
    // Set streaming payload
    payload.stream = true;

    try {
      const stream = this.chatService.sendMessageStream(payload);

      for await (const chunk of stream) {
        if (chunk.done) {
          response.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
          break;
        } else {
          response.write(
            `data: ${JSON.stringify({ type: 'content', content: chunk.content })}\n\n`,
          );
        }
      }
    } catch (error) {
      response.write(
        `data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`,
      );
    } finally {
      response.end();
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
