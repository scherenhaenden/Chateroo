import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatPayload } from './ai-engine/ai-api-engine.base';

// DTO für eingehende Anfragen als Klasse definieren
class ChatRequestDto implements ChatPayload {
  provider: string;
  prompt: string;
  apiKey?: string;
}

@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  sendMessage(@Body() requestDto: ChatRequestDto) {
    const { provider, ...payload } = requestDto;
    return this.chatService.handleMessage(provider, payload);
  }
}

