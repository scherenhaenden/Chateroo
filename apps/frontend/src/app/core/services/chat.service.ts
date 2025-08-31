import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SendMessagePayload {
  provider: string;
  prompt: string;
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

export interface ChatApiResponse {
  content: string;
}

// Interface für Streaming-Events
export interface StreamEvent {
  content: string;
  done?: boolean;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  top_provider: { id: string; is_moderated: boolean };
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private apiUrl = 'http://localhost:3000/api/chat';

  public constructor(private http: HttpClient) {}

  /**
   * Sends a message to the backend with the provided payload (non-streaming).
   */
  public sendMessage(payload: SendMessagePayload): Observable<ChatApiResponse> {
    return this.http.post<ChatApiResponse>(this.apiUrl, payload);
  }

  /**
   * Sends a message with streaming support using Server-Sent Events
   */
  public sendMessageStream(payload: SendMessagePayload): Observable<StreamEvent> {
    return new Observable<StreamEvent>((observer) => {
      this.streamWithFetch({ ...payload, stream: true }, observer);

      return () => {
        // Cleanup function
      };
    });
  }

  private async streamWithFetch(payload: SendMessagePayload, observer: any) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          observer.next({ content: '', done: true });
          observer.complete();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;

          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              observer.next({ content: '', done: true });
              observer.complete();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                observer.next({ content: parsed.content });
              } else if (parsed.error) {
                observer.error(new Error(parsed.error));
                return;
              }
            } catch (e) {
              // If it's not JSON, treat it as plain text content
              if (data && data !== '[DONE]') {
                observer.next({ content: data });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      observer.error(error);
    }
  }

  public getOpenRouterModels(apiKey: string): Observable<OpenRouterModel[]> {
    return this.http.get<OpenRouterModel[]>(`${this.apiUrl}/openrouter/models`, {
      params: { apiKey },
    });
  }
}
