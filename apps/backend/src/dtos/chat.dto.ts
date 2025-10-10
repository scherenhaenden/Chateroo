import { ApiProperty } from '@nestjs/swagger';

/**
 * Represents a chat message exchanged between the user, assistant, or system.
 */
export class ChatMessage {
  @ApiProperty({
    description: 'The role of the message sender',
    enum: ['user', 'assistant', 'system'],
    example: 'user',
  })
  role: 'user' | 'assistant' | 'system';

  @ApiProperty({
    description: 'The content of the message',
    example: 'Hello, how can you help me today?',
  })
  content: string;

  @ApiProperty({
    description: 'File attachments for the message',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'document.pdf' },
        type: { type: 'string', example: 'application/pdf' },
        base64: { type: 'string', example: 'JVBERi0xLjQK...' },
        size: { type: 'number', example: 1024 },
      },
    },
    required: false,
  })
  attachments?: {
    name: string;
    type: string;
    base64: string;
    size: number;
  }[];
}

/**
 * Data Transfer Object (DTO) for sending a message.
 */
export class SendMessageDto {
  @ApiProperty({
    description: 'The AI provider to use for processing the message',
    example: 'lm-studio',
    enum: ['openai', 'gemini', 'lm-studio', 'openrouter', 'mistral', 'perplexity', 'grok', 'deepseek'],
  })
  provider: string;

  @ApiProperty({
    description: 'Complete conversation history (new format)',
    type: [ChatMessage],
    required: false,
  })
  messages?: ChatMessage[];

  @ApiProperty({
    description: 'Single prompt message (legacy format for backward compatibility)',
    example: 'What is the weather like today?',
    required: false,
  })
  prompt?: string;

  @ApiProperty({
    description: 'API key for the selected provider (if required)',
    example: 'sk-...',
    required: false,
  })
  apiKey?: string;

  @ApiProperty({
    description: 'Specific model to use with the provider',
    example: 'gpt-4',
    required: false,
  })
  model?: string;

  @ApiProperty({
    description: 'Enable streaming response',
    example: true,
    default: false,
    required: false,
  })
  stream?: boolean;

  @ApiProperty({
    description: 'File attachments for the message',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'image.jpg' },
        type: { type: 'string', example: 'image/jpeg' },
        base64: { type: 'string', example: '/9j/4AAQSkZJRgABA...' },
        size: { type: 'number', example: 2048 },
      },
    },
    required: false,
  })
  attachments?: {
    name: string;
    type: string;
    base64: string;
    size: number;
  }[];
}
