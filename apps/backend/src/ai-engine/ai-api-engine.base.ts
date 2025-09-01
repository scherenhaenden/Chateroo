export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatAttachment {
  name: string;
  type: string;
  base64: string;
  size: number;
}

export interface ChatPayload {
  prompt: string;
  apiKey?: string;
  model?: string;
  attachments?: ChatAttachment[];
  stream?: boolean; // Neue Option für Streaming
  messages?: ChatMessage[]; // Array of conversation messages
}

export interface ChatResponse {
  content: string;
}

// Neue Interface für Streaming-Chunks
export interface StreamChunk {
  content: string;
  done?: boolean;
}

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
  public async* sendMessageStream?(payload: ChatPayload): AsyncIterableIterator<StreamChunk> {
    // Fallback für Engines ohne Streaming-Support
    const response = await this.sendMessage(payload);
    yield { content: response.content, done: true };
  }
}
