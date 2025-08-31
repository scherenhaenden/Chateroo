import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AiApiEngine, ChatPayload, ChatResponse } from './ai-api-engine.base';

@Injectable()
export class GeminiEngine extends AiApiEngine {
  public readonly provider = 'gemini';
  private readonly apiUrl =
    'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

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

    // Erweitere die Nachricht um Datei-Informationen
    let messageContent = payload.prompt;

    if (payload.attachments && payload.attachments.length > 0) {
      const attachmentInfo = payload.attachments
        .map((att) => {
          if (att.type.startsWith('image/')) {
            return `[BILD: ${att.name} - ${this.formatFileSize(att.size)}]`;
          } else if (this.isTextFile(att.type)) {
            try {
              const content = Buffer.from(att.base64, 'base64').toString(
                'utf-8',
              );
              return `[DATEI: ${att.name}]\n${content.substring(0, 1500)}${content.length > 1500 ? '\n[...gekürzt]' : ''}`;
            } catch (e) {
              return `[DATEI: ${att.name} - nicht lesbar]`;
            }
          }
          return `[DATEI: ${att.name} - ${this.formatFileSize(att.size)}]`;
        })
        .join('\n\n');

      messageContent = `${payload.prompt}\n\nAngehängte Dateien:\n${attachmentInfo}`;
    }

    const body = {
      model: 'gemini-1.5-flash',
      messages: [{ role: 'user', content: messageContent }],
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
        error.response?.data || error.message,
      );
      return {
        content: 'Sorry, there was an error communicating with Gemini.',
      };
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private isTextFile(mimeType: string): boolean {
    const textTypes = [
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/json',
      'text/html',
      'text/css',
      'text/javascript',
      'application/javascript',
      'text/xml',
      'application/xml',
      'application/typescript',
    ];
    return textTypes.includes(mimeType) || mimeType.startsWith('text/');
  }
}
