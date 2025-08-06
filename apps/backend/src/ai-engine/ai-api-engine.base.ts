export interface ChatPayload {
  prompt: string;
  apiKey?: string;
}

export interface ChatResponse {
  content: string;
}

export abstract class AiApiEngine {
  abstract readonly provider: string;
  /**
   * Sends a chat message with the provided payload and returns a promise resolving to the chat response.
   */
  abstract sendMessage(payload: ChatPayload): Promise<ChatResponse>;
}
