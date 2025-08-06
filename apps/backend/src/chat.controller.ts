import { Controller, Post, Body, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatPayload, ChatResponse } from './ai-engine/ai-api-engine.base';

// This class defines the shape of the data coming from the frontend.
class ChatRequestDto implements ChatPayload {
  provider: string;
  prompt: string;
  apiKey?: string;
}

@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Receives a chat message from the frontend, identifies the provider
   * from the request body, and passes it to the ChatService.
   */
  @Post()
  sendMessage(@Body() requestDto: ChatRequestDto): Promise<ChatResponse> {
    const { provider, ...payload } = requestDto;
    return this.chatService.handleMessage(provider, payload);
  }
}