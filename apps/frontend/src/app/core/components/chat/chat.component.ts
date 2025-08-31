import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { ChatService, SendMessagePayload, ChatApiResponse } from '../../services/chat.service';
import { SettingsService } from '../../services/settings.service';
import { ChatMessage } from '../../../models/chat.model';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './chat.component.html',
})
export class ChatComponent implements OnInit {
  public chatForm!: FormGroup;
  public messages: ChatMessage[] = [];
  public isLoading = false;

  private readonly providersWithApiKey = [
    'openai',
    'mistral',
    'gemini',
    'perplexity',
    'grok',
    'deepseek',
  ];

  public constructor(
    private fb: FormBuilder,
    private chatService: ChatService,
    private settingsService: SettingsService,
  ) {
    this.chatForm = this.fb.group({
      provider: ['lm-studio', Validators.required],
      apiKey: [''],
      prompt: ['', Validators.required],
    });
  }

  public requiresApiKey(provider: string | null | undefined): boolean {
    return provider ? this.providersWithApiKey.includes(provider) : false;
  }

  public async ngOnInit(): Promise<void> {
    await this.settingsService.load();

    this.chatForm.get('provider')?.valueChanges.subscribe((provider) => {
      const apiKeyControl = this.chatForm.get('apiKey');
      if (this.providersWithApiKey.includes(provider)) {
        apiKeyControl?.setValidators([Validators.required]);
      } else {
        apiKeyControl?.clearValidators();
      }
      apiKeyControl?.updateValueAndValidity();
    });

    this.messages.push({
      sender: 'ai',
      text: 'Welcome! Select a provider and ask a question.',
    });
  }

  public sendMessage(): void {
    if (this.chatForm.invalid) return;

    const formValue = this.chatForm.value;
    this.addUserAndLoadingMessages(formValue.prompt);
    this.togglePrompt(false);

    const apiKey = formValue.apiKey || this.settingsService.getApiKey(formValue.provider);
    const payload: SendMessagePayload = {
      provider: formValue.provider,
      prompt: formValue.prompt,
      apiKey: apiKey || undefined,
    };

    this.chatService.sendMessage(payload).subscribe({
      next: (res) => this.handleSuccess(res),
      error: (err) => this.handleError(err),
    });
  }

  /**
   * Converts markdown text to sanitized HTML.
   * @param text The raw markdown text from the LLM.
   */
  public renderMarkdown(text: string): string {
    const rawHtml = marked.parse(text);
    const sanitizedHtml = DOMPurify.sanitize(rawHtml as string);
    return sanitizedHtml;
  }

  /**
   * Adds a user message and an AI loading message to the messages array and sets isLoading to true.
   */
  private addUserAndLoadingMessages(prompt: string): void {
    this.messages.push({ sender: 'user', text: prompt });
    this.messages.push({ sender: 'ai', text: '', isLoading: true });
    this.isLoading = true;
  }

  private togglePrompt(enable: boolean): void {
    const control = this.chatForm.get('prompt');
    if (enable) {
      control?.enable();
      control?.reset();
    } else {
      control?.disable();
    }
  }

  private handleSuccess(res: ChatApiResponse): void {
    const lastIndex = this.messages.length - 1;
    this.messages[lastIndex] = { sender: 'ai', text: res.content };
    this.isLoading = false;
    this.togglePrompt(true);
  }

  private handleError(err: any): void {
    const errorMessage = `Error: ${err.error?.message || 'Failed to communicate with the backend.'}`;
    const lastIndex = this.messages.length - 1;
    this.messages[lastIndex] = { sender: 'ai', text: errorMessage };
    this.isLoading = false;
    this.togglePrompt(true);
  }
}

