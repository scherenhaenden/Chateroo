import { Controller, Post, Body, Res, Headers, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiHeader } from '@nestjs/swagger';
import type { Response } from 'express';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dtos/chat.dto';

@ApiTags('chat')
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
    console.log('Received payload in backend:', payload);
  }

  @Post()
  @ApiOperation({
    summary: 'Send a message to AI provider',
    description: 'Sends a message to the specified AI provider. Supports both streaming and non-streaming responses. For streaming, set stream=true in the request body or include "text/event-stream" in the Accept header.',
  })
  @ApiBody({
    type: SendMessageDto,
    examples: {
      'Simple message': {
        summary: 'Simple message to LM Studio',
        value: {
          provider: 'lm-studio',
          prompt: 'Hello, how are you?',
        },
      },
      'Conversation history': {
        summary: 'Message with conversation history',
        value: {
          provider: 'lm-studio',
          messages: [
            { role: 'user', content: 'What is TypeScript?' },
            { role: 'assistant', content: 'TypeScript is a typed superset of JavaScript...' },
            { role: 'user', content: 'Can you give me an example?' },
          ],
          stream: true,
        },
      },
      'OpenAI with API Key': {
        summary: 'Message to OpenAI with API key',
        value: {
          provider: 'openai',
          prompt: 'Explain quantum computing',
          apiKey: 'sk-...',
          model: 'gpt-4',
        },
      },
    },
  })
  @ApiHeader({
    name: 'accept',
    description: 'Set to "text/event-stream" for streaming responses',
    required: false,
    example: 'text/event-stream',
  })
  @ApiResponse({
    status: 200,
    description: 'Message sent successfully',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              example: 'Hello! I am an AI assistant. How can I help you today?',
            },
          },
        },
      },
      'text/event-stream': {
        schema: {
          type: 'string',
          example: 'data: {"content":"Hello"}\n\ndata: {"content":" there!"}\n\ndata: [DONE]\n\n',
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    schema: {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          example: 'An error occurred while processing your request',
        },
        details: {
          type: 'string',
          example: 'Provider openai not supported',
        },
      },
    },
  })
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

  /**
   * Fetches OpenRouter models based on the provided API key.
   *
   * This function makes an asynchronous call to the chatService's getOpenRouterModels method, passing the apiKey as an argument.
   * It handles any potential errors by logging them to the console and rethrowing the error for further handling.
   *
   * @param {string} [apiKey] - The API key used to authenticate the request.
   */
  @Get('openrouter/models')
  @ApiTags('providers')
  @ApiOperation({
    summary: 'Get OpenRouter models',
    description: 'Retrieves the list of available models from OpenRouter. Requires an API key for full model list.',
  })
  @ApiQuery({
    name: 'apiKey',
    description: 'OpenRouter API key (optional - returns limited list without key)',
    required: false,
    example: 'sk-or-...',
  })
  @ApiResponse({
    status: 200,
    description: 'List of OpenRouter models retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'openai/gpt-4' },
          name: { type: 'string', example: 'GPT-4' },
          description: { type: 'string', example: 'OpenAI GPT-4 model' },
          context_length: { type: 'number', example: 8192 },
        },
      },
    },
  })
  async getOpenRouterModels(@Query('apiKey') apiKey?: string) {
    try {
      return await this.chatService.getOpenRouterModels(apiKey);
    } catch (error) {
      console.error('Error fetching OpenRouter models:', error);
      throw error;
    }
  }

  @Get('openrouter/providers')
  @ApiTags('providers')
  @ApiOperation({
    summary: 'Get OpenRouter providers',
    description: 'Retrieves the list of available AI providers from OpenRouter.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of OpenRouter providers retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'OpenAI' },
          slug: { type: 'string', example: 'openai' },
        },
      },
    },
  })
  async getOpenRouterProviders() {
    try {
      return await this.chatService.getOpenRouterProviders();
    } catch (error) {
      console.error('Error fetching OpenRouter providers:', error);
      throw error;
    }
  }
}
