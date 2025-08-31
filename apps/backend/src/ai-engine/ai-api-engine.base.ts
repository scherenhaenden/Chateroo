export interface ChatPayload {
  prompt: string;
  apiKey?: string;
  /** Optionales Modell, das für die Anfrage verwendet werden soll. */
  model?: string;
  /** Temperaturwert zur Steuerung der Zufälligkeit. */
  temperature?: number;
  /** Maximale Anzahl an Tokens für die Antwort. */
  maxTokens?: number;
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
