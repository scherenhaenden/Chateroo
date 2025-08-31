import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CopyBoxComponent } from '../copy-box/copy-box.component';
import { CanvasComponent } from '../canvas/canvas.component';
import { AttachmentDisplayComponent } from '../attachment-display/attachment-display.component';
import { ChatMessage } from '../../../models/chat.model';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface TextSegment {
  type: 'text';
  content: string;
}

interface CodeSegment {
  type: 'code';
  content: string;
  language: string;
}

type Segment = TextSegment | CodeSegment;

@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [CommonModule, CopyBoxComponent, CanvasComponent, AttachmentDisplayComponent],
  templateUrl: './chat-message.component.html',
})
export class ChatMessageComponent implements OnInit {
  @Input() public message!: ChatMessage;
  @Output() public canvasRequested = new EventEmitter<string>();
  @Output() public liveCodeRequested = new EventEmitter<string>();

  public segments: Segment[] = [];

  public ngOnInit(): void {
    this.segments = this.parseSegments(this.message.text || this.message.content || '');
  }

  public renderMarkdown(text: string): string {
    // Si el texto contiene HTML que no está en bloques de código, preservarlo
    if (this.containsRawHTML(text)) {
      // Escapar el HTML para mostrarlo como texto plano
      return this.escapeHtml(text);
    }

    const rawHtml = marked.parse(text);
    return DOMPurify.sanitize(rawHtml as string);
  }

  private containsRawHTML(text: string): boolean {
    // Verificar si hay etiquetas HTML que no están dentro de bloques de código
    const htmlTagRegex = /<[^>]+>/;
    const codeBlockRegex = /```[\s\S]*?```/g;

    // Remover bloques de código del texto para verificar HTML fuera de ellos
    const textWithoutCodeBlocks = text.replace(codeBlockRegex, '');

    return htmlTagRegex.test(textWithoutCodeBlocks);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private parseSegments(text: string): Segment[] {
    const segments: Segment[] = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      }
      segments.push({ type: 'code', language: match[1] || '', content: match[2] });
      lastIndex = codeBlockRegex.lastIndex;
    }
    if (lastIndex < text.length) {
      segments.push({ type: 'text', content: text.slice(lastIndex) });
    }
    return segments;
  }

  public isRenderable(language: string): boolean {
    return ['html', 'svg'].includes(language.toLowerCase());
  }

  public openCanvas(): void {
    if (this.message.canvasCode) {
      this.canvasRequested.emit(this.message.canvasCode);
    }
  }

  public openLiveCode(): void {
    if (this.message.liveCode) {
      this.liveCodeRequested.emit(this.message.liveCode);
    }
  }
}
