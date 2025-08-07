import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AiApiEngine, ChatPayload, ChatResponse } from './ai-api-engine.base';

@Injectable()
export class GeminiEngine extends AiApiEngine {
  public readonly provider = 'gemini';
  private readonly apiUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

  public constructor(private readonly httpService: HttpService) {
    super();
  }

  /**
   * Sends a message to the Gemini API and returns the response.
   *
   * It constructs the request headers and body, sends a POST request to the specified API URL,
   * and processes the response. If the response is invalid or an error occurs during communication,
   * it logs the error and returns a default error message.
   *
   * @param payload - An object containing the apiKey and prompt for the Gemini API request.
   * @returns A promise that resolves to a ChatResponse object containing the response content.
   */
  public async sendMessage(payload: ChatPayload): Promise<ChatResponse> {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${payload.apiKey}`,
    };

    const body = {
      model: 'gemini-1.5-flash',
      messages: [{ role: 'user', content: payload.prompt }],
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(this.apiUrl, body, { headers }),
      );
      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Keine gültige Antwort von Gemini erhalten.');
      }
      return { content };
    } catch (error) {
      console.error(
        'Fehler bei der Kommunikation mit Gemini:',
        (error as any).response?.data || (error as any).message,
      );
      return { content: 'Sorry, there was an error communicating with Gemini.' };
    }
  }
}
