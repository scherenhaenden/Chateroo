export interface ChatPayload {
  prompt: string;
  apiKey?: string;
  // Zukünftige Optionen wie temperature, model, etc. können hier hinzugefügt werden
}

export interface ChatResponse {
  content: string;
}

export abstract class AiApiEngine {
  abstract readonly provider: string;
  abstract sendMessage(payload: ChatPayload): Promise<ChatResponse>;
}
