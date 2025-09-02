import { Controller, Post, Body, Res, Headers, Get, Query } from '@nestjs/common';
import type { Response } from 'express';
import { ChatService } from './chat.service';
import type { SendMessageDto } from './dtos/chat.dto';

@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  private setupStreamHeaders(res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    (res as any).flushHeaders?.();
  }

  private logPayload(payload: SendMessageDto): void {
    console.log('Received payload:', payload);
  }

  @Post()
  async sendMessage(
    @Body() payload: SendMessageDto,
    @Res() res: Response,
    @Headers('accept') accept?: string,
  ) {
    this.logPayload(payload);

    const isStream = payload.stream || accept?.includes('text/event-stream');

    if (isStream) {
      this.setupStreamHeaders(res);
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
