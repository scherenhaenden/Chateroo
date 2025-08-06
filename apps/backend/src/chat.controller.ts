import { Body, Controller, Param, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatPayload, ChatResponse } from './ai-engine/ai-api-engine.base';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Sends a message through the specified provider with the given payload.
   */
  @Post(':provider')
  async sendMessage(
    @Param('provider') provider: string,
    @Body() payload: ChatPayload,
  ): Promise<ChatResponse> {
    return this.chatService.sendMessage(provider, payload);
  }
}
