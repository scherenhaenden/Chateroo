import { Injectable } from '@nestjs/common';
import { AiApiEngine, ChatPayload, ChatResponse } from './ai-api-engine.base';

@Injectable()
export class OpenAiEngine extends AiApiEngine {
  public readonly provider = 'openai';

  private formatFileSize(size: number): string {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }

  private isTextFile(type: string): boolean {
    return type.startsWith('text/');
  }

  private processAttachments(attachments: ChatPayload['attachments']): string {
    return attachments?.map(att => {
      if (att.type.startsWith('image/')) {
        return `Bild: ${att.name} (${this.formatFileSize(att.size)})`;
      } else if (this.isTextFile(att.type)) {
        try {
          const content = Buffer.from(att.base64, 'base64').toString('utf-8');
          return `Datei: ${att.name}\nInhalt:\n${content.substring(0, 1000)}${content.length > 1000 ? '...' : ''}`;
        } catch {
          return `Datei: ${att.name} (${this.formatFileSize(att.size)}) - Konnte nicht gelesen werden`;
        }
      }
      return `Datei: ${att.name} (${this.formatFileSize(att.size)})`;
    }).join('\n') || '';
  }

  /**
   * Sends a message using the provided payload and returns a chat response, handling missing API key.
   */
  public async sendMessage(payload: ChatPayload): Promise<ChatResponse> {
    if (!payload.apiKey) {
      return { content: 'Fehler: OpenAI API-Schlüssel fehlt.' };
    }

    try {
      let enhancedPrompt = payload.prompt;

      if (payload.attachments && payload.attachments.length > 0) {
        const attachmentInfo = this.processAttachments(payload.attachments);
        enhancedPrompt = `${payload.prompt}\n\nAngehängte Dateien:\n${attachmentInfo}`;
      }

      // TODO: Hier würde die echte OpenAI API-Integration stehen
      // Für jetzt simulieren wir die Antwort
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = `OpenAI würde auf "${payload.prompt}" antworten.`;

      return { content: response };

    } catch (error) {
      console.error('Error in OpenAiEngine:', error);
      throw error;
    }
  }
}
