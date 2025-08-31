import { Controller, Post, Body, Res, Headers } from '@nestjs/common';
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
  prompt?: string;          // Legacy format for backward compatibility
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
    // Für jetzt: Immer normale HTTP-Antworten verwenden (kein Streaming)
    console.log('Received payload:', payload);

    try {
      const result = await this.chatService.sendMessage(payload);
      console.log('Sending response:', result);
      res.json(result);
    } catch (error) {
      console.error('Error in chat controller:', error);
      res.status(500).json({
        error: 'An error occurred while processing your request',
        details: error.message
      });
    }
  }
}
