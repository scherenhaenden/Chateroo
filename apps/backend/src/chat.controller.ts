import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatPayload, ChatResponse, ChatAttachment } from './ai-engine/ai-api-engine.base';
import { OpenRouterModel } from './ai-engine/openrouter.engine';

// This class defines the shape of the data coming from the frontend.
class ChatRequestDto implements ChatPayload {
  public provider: string;
  public prompt: string;
  public apiKey?: string;
  public model?: string;
  public attachments?: ChatAttachment[];
}

@Controller('api/chat')
export class ChatController {
  public constructor(private readonly chatService: ChatService) {}

  /**
   * Handles incoming chat messages, identifies the provider, and processes them via ChatService.
   */
  @Post()
  public sendMessage(@Body() requestDto: ChatRequestDto): Promise<ChatResponse> {
    const { provider, ...payload } = requestDto;
    return this.chatService.handleMessage(provider, payload);
  }

  @Get('openrouter/models')
  public listOpenRouterModels(
    @Query('apiKey') apiKey: string,
  ): Promise<OpenRouterModel[]> {
    return this.chatService.listOpenRouterModels(apiKey);
  }
}