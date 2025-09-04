import { ChatPayload } from './models/chat-payload.model';
import { ChatResponse } from './models/chat-response.model';
import { StreamChunk } from './models/stream-chunk.model';
import { ChatAttachment } from './models/chat-attachment.model';
// Re-export models for backward compatibility
export type { ChatPayload } from './models/chat-payload.model';
export type { ChatResponse } from './models/chat-response.model';
export type { StreamChunk } from './models/stream-chunk.model';


export abstract class AiApiEngine {
  public abstract readonly provider: string;
  /**
   * Sends a chat message with the provided payload and returns a promise resolving to the chat response.
   */
  public abstract sendMessage(payload: ChatPayload): Promise<ChatResponse>;

  /**
   * Sends a chat message with streaming support.
   * Returns an AsyncIterableIterator for real-time response chunks.
   */
  public async *sendMessageStream?(
    payload: ChatPayload,
  ): AsyncIterableIterator<StreamChunk> {
    // Fallback für Engines ohne Streaming-Support
    const response = await this.sendMessage(payload);
    yield { content: response.content, done: true };
  }
}
