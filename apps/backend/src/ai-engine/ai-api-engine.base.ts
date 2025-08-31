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
  // Zukünftige Optionen wie temperature, etc. können hier hinzugefügt werden
}

export interface ChatResponse {
  content: string;
}

export abstract class AiApiEngine {
  public abstract readonly provider: string;
  /**
   * Sends a chat message with the provided payload and returns a promise resolving to the chat response.
   */
  public abstract sendMessage(payload: ChatPayload): Promise<ChatResponse>;
}
