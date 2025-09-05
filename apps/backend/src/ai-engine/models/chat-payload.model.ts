import { ChatAttachment } from './chat-attachment.model';
import { ChatMessage } from '../../dtos/chat.dto';

export interface ChatPayload {
  prompt: string;
  apiKey?: string;
  model?: string;
  attachments?: ChatAttachment[];
  stream?: boolean;
  messages?: ChatMessage[];
}
