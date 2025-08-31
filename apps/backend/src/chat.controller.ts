import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatPayload, ChatResponse } from './ai-engine/ai-api-engine.base';

// This class defines the shape of the data coming from the frontend.
class ChatRequestDto implements ChatPayload {
  public provider: string;
  public prompt: string;
  public apiKey?: string;
  public model?: string;
  public temperature?: number;
  public maxTokens?: number;
}

@Controller('api/chat')
export class ChatController {
  public constructor(private readonly chatService: ChatService) {}

  /**
   * Handles incoming chat messages, identifies the provider, and processes them via ChatService.
   */
  @Post()
  public sendMessage(
    @Body() requestDto: ChatRequestDto,
  ): Promise<ChatResponse> {
    const { provider, ...payload } = requestDto;
    return this.chatService.handleMessage(provider, payload);
  }
}
