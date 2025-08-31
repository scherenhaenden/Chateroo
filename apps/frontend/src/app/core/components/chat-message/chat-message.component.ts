import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CopyBoxComponent } from '../copy-box/copy-box.component';
import { CanvasComponent } from '../canvas/canvas.component';
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
  imports: [CommonModule, CopyBoxComponent, CanvasComponent],
  templateUrl: './chat-message.component.html',
})
export class ChatMessageComponent implements OnInit {
  @Input() public message!: ChatMessage;
  @Output() public canvasRequested = new EventEmitter<string>();
  @Output() public liveCodeRequested = new EventEmitter<string>();

  public segments: Segment[] = [];

  public ngOnInit(): void {
    this.segments = this.parseSegments(this.message.text);
  }

  public renderMarkdown(text: string): string {
    const rawHtml = marked.parse(text);
    return DOMPurify.sanitize(rawHtml as string);
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
