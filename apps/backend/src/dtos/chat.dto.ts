// filepath: /Users/edwardflores/Projects/Development/Chateroo/apps/backend/src/dtos/chat.dto.ts

/**
 * Represents a chat message exchanged between the user, assistant, or system.
 */
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

/**
 * Data Transfer Object (DTO) for sending a message.
 */
export interface SendMessageDto {
  provider: string;
  messages?: ChatMessage[]; // New format with conversation history
  prompt?: string; // Legacy format for backward compatibility
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
