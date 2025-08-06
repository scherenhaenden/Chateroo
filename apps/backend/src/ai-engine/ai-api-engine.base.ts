export interface ChatPayload {
  prompt: string;
  apiKey?: string;
}

export interface ChatResponse {
  content: string;
}

export abstract class AiApiEngine {
  abstract readonly provider: string;
  abstract sendMessage(payload: ChatPayload): Promise<ChatResponse>;
}
