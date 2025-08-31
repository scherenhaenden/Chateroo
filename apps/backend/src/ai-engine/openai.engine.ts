import { Injectable } from '@nestjs/common';
import { AiApiEngine, ChatPayload, ChatResponse } from './ai-api-engine.base';

@Injectable()
export class OpenAiEngine extends AiApiEngine {
  public readonly provider = 'openai';

  /**
   * Sends a message using the provided payload and returns a chat response, handling missing API key.
   */
  public async sendMessage(payload: ChatPayload): Promise<ChatResponse> {
    if (!payload.apiKey) {
      return { content: 'Fehler: OpenAI API-Schlüssel fehlt.' };
    }

    try {
      // Bereite den Prompt vor
      let enhancedPrompt = payload.prompt;

      // Wenn Anhänge vorhanden sind, füge Informationen hinzu
      if (payload.attachments && payload.attachments.length > 0) {
        const attachmentInfo = payload.attachments.map(att => {
          if (att.type.startsWith('image/')) {
            return `Bild: ${att.name} (${this.formatFileSize(att.size)})`;
          } else {
            // Für Textdateien könnte man den Inhalt dekodieren
            if (this.isTextFile(att.type)) {
              try {
                const content = Buffer.from(att.base64, 'base64').toString('utf-8');
                return `Datei: ${att.name}\nInhalt:\n${content.substring(0, 1000)}${content.length > 1000 ? '...' : ''}`;
              } catch (e) {
                return `Datei: ${att.name} (${this.formatFileSize(att.size)}) - Konnte nicht gelesen werden`;
              }
            }
            return `Datei: ${att.name} (${this.formatFileSize(att.size)})`;
          }
        }).join('\n');

        enhancedPrompt = `${payload.prompt}\n\nAngehängte Dateien:\n${attachmentInfo}`;
      }

      // TODO: Hier würde die echte OpenAI API-Integration stehen
      // Für jetzt simulieren wir die Antwort
      await new Promise(resolve => setTimeout(resolve, 1000));

      let response = `OpenAI würde auf "${payload.prompt}" antworten.`;

      if (payload.attachments && payload.attachments.length > 0) {
        const imageCount = payload.attachments.filter(att => att.type.startsWith('image/')).length;
        const fileCount = payload.attachments.length - imageCount;

        response += `\n\nIch sehe, dass Sie ${imageCount > 0 ? `${imageCount} Bild(er)` : ''}${imageCount > 0 && fileCount > 0 ? ' und ' : ''}${fileCount > 0 ? `${fileCount} Datei(en)` : ''} angehängt haben.`;

        if (imageCount > 0) {
          response += ' Als KI mit Vision-Fähigkeiten könnte ich diese Bilder analysieren und beschreiben.';
        }
      }

      return { content: response };

    } catch (error) {
      return { content: `OpenAI-Fehler: ${error.message}` };
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
      'application/xml'
    ];
    return textTypes.includes(mimeType) || mimeType.startsWith('text/');
  }
}
