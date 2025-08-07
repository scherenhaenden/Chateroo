import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface SendMessagePayload {
  provider: string;
  prompt: string;
  apiKey?: string;
}

export interface ChatApiResponse {
  content: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private apiUrl = 'http://localhost:3000/api/chat'; // URL des NestJS-Backends

  public constructor(private http: HttpClient) {}

  /**
   * Sends a message using either a local model or an external provider.
   *
   * This function checks the provider specified in the payload and constructs
   * the request body accordingly. If the provider is 'lm-studio', it sends the
   * request to a local server with a fixed configuration. For other providers,
   * it posts the payload directly to the configured API URL.
   *
   * @param payload - The message payload containing details like prompt and provider.
   */
  public sendMessage(payload: SendMessagePayload): Observable<ChatApiResponse> {
    if (payload.provider === 'lm-studio') {
      const body = {
        model: 'local-model',
        messages: [{ role: 'user', content: payload.prompt }],
        temperature: 0.7,
      };

      return this.http
        .post<any>('http://localhost:1234/v1/chat/completions', body, {
          headers: { 'Content-Type': 'application/json' },
        })
        .pipe(
          map((res) => ({ content: res.choices?.[0]?.message?.content || '' })),
        );
    }

    return this.http.post<ChatApiResponse>(this.apiUrl, payload);
  }
}

