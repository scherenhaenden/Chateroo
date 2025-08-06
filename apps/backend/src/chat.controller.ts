import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

// DTO für eingehende Anfragen
class ChatRequestDto {
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
