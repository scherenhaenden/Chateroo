import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SendMessagePayload {
  provider: string;
  prompt: string;
  apiKey?: string;
  model?: string;
}

export interface ChatApiResponse {
  content: string;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  top_provider: { id: string; is_moderated: boolean };
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private apiUrl = 'http://localhost:3000/api/chat'; // URL des NestJS-Backends

  public constructor(private http: HttpClient) {}

  /**
   * Sends a message to the backend with the provided payload.
   */
  public sendMessage(payload: SendMessagePayload): Observable<ChatApiResponse> {
    return this.http.post<ChatApiResponse>(this.apiUrl, payload);
  }

  public getOpenRouterModels(apiKey: string): Observable<OpenRouterModel[]> {
    return this.http.get<OpenRouterModel[]>(`${this.apiUrl}/openrouter/models`, {
      params: { apiKey },
    });
  }
}

