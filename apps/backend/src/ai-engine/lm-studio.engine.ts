import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  AiApiEngine,
  ChatPayload,
  ChatResponse,
  StreamChunk,
} from './ai-api-engine.base';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LmStudioEngine extends AiApiEngine {
  public readonly provider = 'lm-studio';
  private readonly apiUrl = 'http://localhost:1234/v1/chat/completions';

  public constructor(private readonly httpService: HttpService) {
    super();
  }

  /**
   * Sends a message to the LM Studio API and returns the response.
   *
   * It constructs a request body with a model, user message, and temperature.
   * It then sends a POST request to the apiUrl using the httpService.
   * If the response contains valid content, it is returned.
   * If an error occurs during communication or if no valid content is received, an error message is logged,
   * and an error response is returned with details about the failure.
   *
   * @param payload - An object containing the prompt to be sent.
   * @returns A Promise that resolves to a ChatResponse containing the LM Studio's response content.
   */
  public async sendMessage(payload: ChatPayload): Promise<ChatResponse> {
    try {
      const requestBody = {
        model: 'local-model',
        messages: [{ role: 'user', content: payload.prompt }],
        temperature: 0.7,
      };

      const response = await firstValueFrom(
        this.httpService.post(this.apiUrl, requestBody, {
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Keine gültige Antwort von LM Studio erhalten.');
      }
      return { content };
    } catch (error) {
      console.error('Fehler bei der Kommunikation mit LM Studio:', (error as any).message);
      return {
        content:
          'Fehler bei der Verbindung mit LM Studio. Stelle sicher, dass der Server läuft. ' +
          `(Details: ${(error as any).message})`,
      };
    }
  }

  /**
   * Streaming version of sendMessage for real-time responses
   */
  public async *sendMessageStream(
    payload: ChatPayload,
  ): AsyncIterableIterator<StreamChunk> {
    try {
      const requestBody = {
        model: 'local-model',
        messages: [{ role: 'user', content: payload.prompt }],
        temperature: 0.7,
        stream: true, // Enable streaming
      };

      const response = await firstValueFrom(
        this.httpService.post(this.apiUrl, requestBody, {
          headers: { 'Content-Type': 'application/json' },
          responseType: 'stream',
        }),
      );

      let buffer = '';

      for await (const chunk of response.data) {
        buffer += (chunk as any).toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;

          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              yield { content: '', done: true };
              return;
            }

            try {
              const parsed = JSON.parse(data) as any;
              const content = parsed.choices?.[0]?.delta?.content as string;
              if (content) {
                yield { content };
              }
            } catch {
              // Ignore parsing errors for malformed chunks
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Fehler bei der Streaming-Kommunikation mit LM Studio:', error.message);
      yield {
        content: `Fehler bei der Verbindung mit LM Studio. Stelle sicher, dass der Server läuft. (Details: ${error.message})`,
        done: true,
      };
    }
  }
}
