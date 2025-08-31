import { Component, OnInit, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CopyBoxComponent } from '../copy-box/copy-box.component';

import {
  ChatService,
  SendMessagePayload,
  ChatApiResponse,
  OpenRouterModel,
} from '../../services/chat.service';
import { SettingsService } from '../../services/settings.service';
import { ChatMessage } from '../../../models/chat.model';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CopyBoxComponent],
  templateUrl: './chat.component.html',
  host: { class: 'flex flex-col flex-1 min-h-0' },
})
export class ChatComponent implements OnInit, AfterViewChecked {
  public chatForm!: FormGroup;
  public messages: ChatMessage[] = [];
  public isLoading = false;

  public openRouterProviders: string[] = [];
  private openRouterModels: OpenRouterModel[] = [];
  public filteredOpenRouterModels: OpenRouterModel[] = [];

  @ViewChild('chatContainer') private chatContainer!: ElementRef<HTMLDivElement>;

  private readonly providersWithApiKey = [
    'openai',
    'mistral',
    'gemini',
    'perplexity',
    'grok',
    'deepseek',
    'openrouter',
  ];

  public constructor(
    private fb: FormBuilder,
    private chatService: ChatService,
    private settingsService: SettingsService,
  ) {
    this.chatForm = this.fb.group({
      provider: ['lm-studio', Validators.required],
      openRouterProvider: [''],
      model: [''],
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
      const orProviderControl = this.chatForm.get('openRouterProvider');
      const modelControl = this.chatForm.get('model');

      if (this.providersWithApiKey.includes(provider)) {
        apiKeyControl?.setValidators([Validators.required]);
      } else {
        apiKeyControl?.clearValidators();
      }
      apiKeyControl?.updateValueAndValidity();

      if (provider === 'openrouter') {
        orProviderControl?.setValidators([Validators.required]);
        modelControl?.setValidators([Validators.required]);
        void this.loadOpenRouterModels();
      } else {
        orProviderControl?.clearValidators();
        modelControl?.clearValidators();
      }
      orProviderControl?.updateValueAndValidity();
      modelControl?.updateValueAndValidity();
    });

    this.chatForm
      .get('openRouterProvider')
      ?.valueChanges.subscribe((prov) => {
        this.filterModelsForProvider(prov);
      });

    this.chatForm.get('apiKey')?.valueChanges.subscribe(() => {
      if (this.chatForm.get('provider')?.value === 'openrouter') {
        this.loadOpenRouterModels();
      }
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
      model:
        formValue.provider === 'openrouter' ? formValue.model : undefined,
    };

    this.chatService.sendMessage(payload).subscribe({
      next: (res) => this.handleSuccess(res),
      error: (err) => this.handleError(err),
    });
  }

  /**
   * Invoked after the view has been checked to scroll to the bottom.
   */
  public ngAfterViewChecked(): void {
    this.scrollToBottom();
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
   * Splits a message into text and code segments for specialized rendering.
   */
  public parseSegments(text: string): Array<{ type: 'text' | 'code'; content: string; language?: string }> {
    const segments: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
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

  private loadOpenRouterModels(): void {
    const apiKey =
      this.chatForm.get('apiKey')?.value ||
      this.settingsService.getApiKey('openrouter');
    if (!apiKey) return;
    this.chatService.getOpenRouterModels(apiKey).subscribe((models) => {
      this.openRouterModels = models;
      this.openRouterProviders = Array.from(
        new Set(models.map((m) => m.top_provider.id)),
      );
      const providerControl = this.chatForm.get('openRouterProvider');
      if (this.openRouterProviders.length > 0) {
        providerControl?.setValue(this.openRouterProviders[0]);
        this.filterModelsForProvider(this.openRouterProviders[0]);
      }
    });
  }

  private filterModelsForProvider(provider: string): void {
    this.filteredOpenRouterModels = this.openRouterModels.filter(
      (m) => m.top_provider.id === provider,
    );
    const modelControl = this.chatForm.get('model');
    if (this.filteredOpenRouterModels.length > 0) {
      modelControl?.setValue(this.filteredOpenRouterModels[0].id);
    } else {
      modelControl?.setValue('');
    }
  }

  /**
   * Scrolls the chat container to the bottom.
   */
  private scrollToBottom(): void {
    const container = this.chatContainer?.nativeElement;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
}

