import { Component, OnInit, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ChatMessageComponent } from '../chat-message/chat-message.component';
import { CanvasComponent } from '../canvas/canvas.component';
import { LiveCodeComponent } from '../live-code/live-code.component';
import { FileUploadComponent } from '../file-upload/file-upload.component';

import {
  ChatService,
  SendMessagePayload,
  ChatApiResponse,
  OpenRouterModel,
} from '../../services/chat.service';
import { SettingsService } from '../../services/settings.service';
import { ChatMessage, ChatOptions, ChatAttachment } from '../../../models/chat.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ChatMessageComponent, CanvasComponent, LiveCodeComponent, FileUploadComponent],
  templateUrl: './chat.component.html',
  host: { class: 'flex flex-col flex-1 min-h-0' },
})
export class ChatComponent implements OnInit, AfterViewChecked {
  public chatForm!: FormGroup;
  public messages: ChatMessage[] = [];
  public isLoading = false;

  // Nuevas propiedades para Canvas y Live Code
  public chatOptions: ChatOptions = {
    canvasEnabled: false,
    liveCodeEnabled: false
  };
  public showCanvasModal = false;
  public showLiveCodeModal = false;

  public openRouterProviders: string[] = [];
  private openRouterModels: OpenRouterModel[] = [];
  public filteredOpenRouterModels: OpenRouterModel[] = [];

  // File upload properties
  public currentAttachments: ChatAttachment[] = [];
  public uploadError: string = '';

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

    this.chatForm.get('openRouterProvider')?.valueChanges.subscribe((prov) => {
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

    // Erstelle Benutzer-Nachricht mit Anhängen
    const userMessage: ChatMessage = {
      sender: 'user',
      text: formValue.prompt,
      attachments: this.currentAttachments.length > 0 ? [...this.currentAttachments] : undefined
    };

    this.messages.push(userMessage);
    this.messages.push({ sender: 'ai', text: '', isLoading: true });
    this.isLoading = true;

    // PROBLEM 1 LÖSUNG: Input-Feld sofort zurücksetzen und deaktivieren
    const promptControl = this.chatForm.get('prompt');
    const originalPrompt = formValue.prompt;
    promptControl?.setValue('');
    promptControl?.disable();

    const apiKey = formValue.apiKey || this.settingsService.getApiKey(formValue.provider);

    // Modificar den Prompt wenn Canvas oder Live Code aktiviert sind
    let enhancedPrompt = originalPrompt;
    if (this.chatOptions.canvasEnabled) {
      enhancedPrompt += ' (Por favor, incluye código HTML/CSS/SVG visualizable en tu respuesta)';
    }
    if (this.chatOptions.liveCodeEnabled) {
      enhancedPrompt += ' (Por favor, incluye código ejecutable en tu respuesta)';
    }

    const payload: SendMessagePayload = {
      provider: formValue.provider,
      prompt: enhancedPrompt,
      apiKey: apiKey || undefined,
      model: formValue.provider === 'openrouter' ? formValue.model : undefined,
      attachments: this.currentAttachments.length > 0
        ? this.currentAttachments.map(att => ({
            name: att.name,
            type: att.type,
            base64: att.base64!,
            size: att.size
          }))
        : undefined
    };

    // DEBUGGING: Ersten das normale HTTP verwenden statt Streaming
    console.log('Sending message with payload:', payload);

    this.chatService.sendMessage(payload).subscribe({
      next: (res) => {
        console.log('Received response:', res);
        this.handleSuccess(res);
      },
      error: (err) => {
        console.error('Error occurred:', err);
        this.handleError(err);
      },
    });

    // Anhänge nach dem Senden löschen
    this.currentAttachments = [];
  }

  // Neue Methode für Streaming-Chunks
  private handleStreamChunk(chunk: { content: string; done?: boolean }): void {
    const lastIndex = this.messages.length - 1;
    const lastMessage = this.messages[lastIndex];

    if (lastMessage && lastMessage.sender === 'ai') {
      if (chunk.done) {
        // Stream ist beendet
        lastMessage.isLoading = false;
        const codeInfo = this.extractCodeFromResponse(lastMessage.text);
        Object.assign(lastMessage, codeInfo);
        this.isLoading = false;
        this.togglePrompt(true);
      } else {
        // Füge neuen Content zum bestehenden Text hinzu
        lastMessage.text += chunk.content;
        lastMessage.isLoading = true; // Zeige weiterhin Loading-Animation
      }
    }
  }

  // Neue Methode für Stream-Completion
  private handleStreamComplete(): void {
    const lastIndex = this.messages.length - 1;
    const lastMessage = this.messages[lastIndex];

    if (lastMessage && lastMessage.sender === 'ai') {
      lastMessage.isLoading = false;
      const codeInfo = this.extractCodeFromResponse(lastMessage.text);
      Object.assign(lastMessage, codeInfo);
    }

    this.isLoading = false;
    this.togglePrompt(true);
  }

  // Nuevos métodos para Canvas y Live Code
  public toggleCanvas(): void {
    this.chatOptions.canvasEnabled = !this.chatOptions.canvasEnabled;
  }

  public toggleLiveCode(): void {
    this.chatOptions.liveCodeEnabled = !this.chatOptions.liveCodeEnabled;
  }

  public openCanvasModal(): void {
    this.showCanvasModal = true;
  }

  public closeCanvasModal(): void {
    this.showCanvasModal = false;
  }

  public openLiveCodeModal(): void {
    this.showLiveCodeModal = true;
  }

  public closeLiveCodeModal(): void {
    this.showLiveCodeModal = false;
  }

  // Método para detectar código en la respuesta de IA
  private extractCodeFromResponse(content: string): { hasCanvas: boolean; hasLiveCode: boolean; canvasCode?: string; liveCode?: string } {
    const htmlRegex = /```(?:html|svg|xml)([\s\S]*?)```/i;
    const jsRegex = /```(?:javascript|js|ts|typescript)([\s\S]*?)```/i;

    const htmlMatch = content.match(htmlRegex);
    const jsMatch = content.match(jsRegex);

    return {
      hasCanvas: !!htmlMatch,
      hasLiveCode: !!jsMatch,
      canvasCode: htmlMatch ? htmlMatch[1].trim() : undefined,
      liveCode: jsMatch ? jsMatch[1].trim() : undefined
    };
  }

  /** Invoked after the view has been checked to scroll to the bottom. */
  public ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  /** Adds a user message and an AI loading message to the messages array and sets isLoading to true. */
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
    const codeInfo = this.extractCodeFromResponse(res.content);

    this.messages[lastIndex] = {
      sender: 'ai',
      text: res.content,
      ...codeInfo
    };
    this.isLoading = false;
    this.togglePrompt(true);
  }

  // Métodos para manejar eventos desde los mensajes
  public onCanvasRequested(code: string): void {
    // Actualizar el código del canvas y abrir el modal
    const lastMessage = this.messages[this.messages.length - 1];
    if (lastMessage) {
      lastMessage.canvasCode = code;
    }
    this.openCanvasModal();
  }

  public onLiveCodeRequested(code: string): void {
    // Actualizar el código live y abrir el modal
    const lastMessage = this.messages[this.messages.length - 1];
    if (lastMessage) {
      lastMessage.liveCode = code;
    }
    this.openLiveCodeModal();
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
      this.chatForm.get('apiKey')?.value || this.settingsService.getApiKey('openrouter');
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

  /** Scrolls the chat container to the bottom. */
  private scrollToBottom(): void {
    const container = this.chatContainer?.nativeElement;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  // File upload event handlers
  public onAttachmentsChange(attachments: ChatAttachment[]): void {
    this.currentAttachments = attachments;
  }

  public onUploadError(error: string): void {
    this.uploadError = error;
    // Fehler nach 5 Sekunden automatisch ausblenden
    setTimeout(() => {
      this.uploadError = '';
    }, 5000);
  }
}
