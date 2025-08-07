import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
   * Sends a message to the backend via HTTP POST.
   */
  public sendMessage(payload: SendMessagePayload): Observable<ChatApiResponse> {
    return this.http.post<ChatApiResponse>(this.apiUrl, payload);
  }
}

