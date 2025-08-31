import { Component, OnInit, AfterViewChecked, ElementRef, ViewChild, OnDestroy } from '@angular/core';
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
import { ChatMessage, ChatOptions, ChatAttachment, ChatSession } from '../../../models/chat.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ChatMessageComponent, CanvasComponent, LiveCodeComponent, FileUploadComponent],
  templateUrl: './chat.component.html',
  host: { class: 'flex flex-col flex-1 min-h-0' },
})
export class ChatComponent implements OnInit, AfterViewChecked, OnDestroy {
  public chatForm!: FormGroup;
  public messages: ChatMessage[] = [];
  public isLoading = false;
  public currentChat: ChatSession | null = null;
  private subscriptions: Subscription[] = [];

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

    // IMPORTANT: Subscribe to currentChat$ in constructor to catch all updates
    this.subscriptions.push(
      this.chatService.currentChat$.subscribe(chat => {
        this.currentChat = chat;
        if (chat) {
          this.messages = [...chat.messages]; // Create new array reference
        } else {
          this.messages = [];
        }
      })
    );

    // Subscribe to new chat requests to ensure proper state sync
    this.subscriptions.push(
      this.chatService.newChatRequested$.subscribe(() => {
        // The ChatService already handles creating the new chat
        // This subscription ensures any additional UI state is reset if needed
        this.isLoading = false;
        this.chatForm.get('prompt')?.enable();
      })
    );
  }

  /**
   * Returns true if the given provider requires an API key.
   * @param provider The provider name
   */
  public requiresApiKey(provider: string | null | undefined): boolean {
    return provider ? this.providersWithApiKey.includes(provider) : false;
  }

  /**
   * Angular lifecycle hook. Loads settings and sets up form listeners.
   */
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

    // Remove the manual message push - this is now handled by ChatService
  }

  /**
   * Angular lifecycle hook. Unsubscribes from all subscriptions.
   */
  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Sends the current message in the chat form.
   */
  public sendMessage(): void {
    if (this.chatForm.invalid) return;

    const formValue = this.chatForm.value;

    // Create user message in both formats (OpenAI + Legacy)
    const userMessage: ChatMessage = {
      role: 'user',
      content: formValue.prompt,
      sender: 'user',
      text: formValue.prompt,
      attachments: this.currentAttachments.length > 0 ? [...this.currentAttachments] : undefined
    };

    // Add user message to current chat
    this.chatService.addMessageToCurrentChat(userMessage);

    // Add loading AI message
    const loadingMessage: ChatMessage = {
      role: 'assistant',
      content: '',
      sender: 'ai',
      text: '',
      isLoading: true
    };
    this.chatService.addMessageToCurrentChat(loadingMessage);

    this.isLoading = true;

    // Reset and disable input
    const promptControl = this.chatForm.get('prompt');
    const originalPrompt = formValue.prompt;
    promptControl?.setValue('');
    promptControl?.disable();

    const apiKey = formValue.apiKey || this.settingsService.getApiKey(formValue.provider);

    // Get current chat and prepare messages for API
    const currentChat = this.chatService.getCurrentChat();
    if (!currentChat) {
      console.error('No current chat found');
      return;
    }

    // Prepare complete conversation history for API
    const apiMessages = this.chatService.prepareMessagesForAPI(currentChat.messages);

    // Add system message if canvas or live code is enabled
    const systemMessages: ChatMessage[] = [];
    if (this.chatOptions.canvasEnabled || this.chatOptions.liveCodeEnabled) {
      let systemContent = 'You are a helpful assistant.';
      if (this.chatOptions.canvasEnabled) {
        systemContent += ' Please include HTML/CSS/SVG code that can be visualized when relevant.';
      }
      if (this.chatOptions.liveCodeEnabled) {
        systemContent += ' Please include executable code examples when relevant.';
      }
      systemMessages.push({
        role: 'system',
        content: systemContent
      });
    }

    const payload: SendMessagePayload = {
      provider: formValue.provider,
      messages: [...systemMessages, ...apiMessages], // Send complete conversation history
      apiKey: apiKey || undefined,
      model: formValue.provider === 'openrouter' ? formValue.model : undefined,
      // Keep legacy prompt for backward compatibility with backend
      prompt: originalPrompt
    };

    console.log('Sending conversation history to API:', payload.messages);

    this.chatService.sendMessage(payload).subscribe({
      next: (res) => {
        this.handleSuccess(res);
      },
      error: (err) => {
        this.handleError(err);
      },
    });

    // Clear attachments
    this.currentAttachments = [];
  }

  /**
   * Handles a successful response from the chat API.
   * @param res The API response
   */
  private handleSuccess(res: ChatApiResponse): void {
    const codeInfo = this.extractCodeFromResponse(res.content);

    // Update the last message (loading message) in current chat with both formats
    this.chatService.updateLastMessageInCurrentChat({
      role: 'assistant',
      content: res.content,
      sender: 'ai',
      text: res.content,
      isLoading: false,
      ...codeInfo
    });

    this.isLoading = false;
    this.togglePrompt(true);
  }

  /**
   * Handles an error response from the chat API.
   * @param err The error object
   */
  private handleError(err: any): void {
    const errorMessage = `Error: ${err.error?.message || 'Failed to communicate with the backend.'}`;

    // Update the last message (loading message) in current chat with both formats
    this.chatService.updateLastMessageInCurrentChat({
      role: 'assistant',
      content: errorMessage,
      sender: 'ai',
      text: errorMessage,
      isLoading: false
    });

    this.isLoading = false;
    this.togglePrompt(true);
  }

  /**
   * Handles a streaming chunk from the chat API.
   * @param chunk The chunk object
   */
  private handleStreamChunk(chunk: { content: string; done?: boolean }): void {
    const lastIndex = this.messages.length - 1;
    const lastMessage = this.messages[lastIndex];

    if (lastMessage && lastMessage.sender === 'ai') {
      if (chunk.done) {
        // Stream ist beendet
        lastMessage.isLoading = false;
        const codeInfo = this.extractCodeFromResponse(lastMessage.text || lastMessage.content || '');
        Object.assign(lastMessage, codeInfo);
        this.isLoading = false;
        this.togglePrompt(true);
      } else {
        // Füge neuen Content zum bestehenden Text hinzu
        const currentText = lastMessage.text || lastMessage.content || '';
        lastMessage.text = currentText + chunk.content;
        lastMessage.content = currentText + chunk.content;
        lastMessage.isLoading = true; // Zeige weiterhin Loading-Animation
      }
    }
  }

  /**
   * Handles the completion of a streaming response from the chat API.
   */
  private handleStreamComplete(): void {
    const lastIndex = this.messages.length - 1;
    const lastMessage = this.messages[lastIndex];

    if (lastMessage && lastMessage.sender === 'ai') {
      lastMessage.isLoading = false;
      const codeInfo = this.extractCodeFromResponse(lastMessage.text || lastMessage.content || '');
      Object.assign(lastMessage, codeInfo);
    }

    this.isLoading = false;
    this.togglePrompt(true);
  }

  /**
   * Toggles the canvas option in chat options.
   */
  public toggleCanvas(): void {
    this.chatOptions.canvasEnabled = !this.chatOptions.canvasEnabled;
  }

  /**
   * Toggles the live code option in chat options.
   */
  public toggleLiveCode(): void {
    this.chatOptions.liveCodeEnabled = !this.chatOptions.liveCodeEnabled;
  }

  /**
   * Opens the canvas modal dialog.
   */
  public openCanvasModal(): void {
    this.showCanvasModal = true;
  }

  /**
   * Closes the canvas modal dialog.
   */
  public closeCanvasModal(): void {
    this.showCanvasModal = false;
  }

  /**
   * Opens the live code modal dialog.
   */
  public openLiveCodeModal(): void {
    this.showLiveCodeModal = true;
  }

  /**
   * Closes the live code modal dialog.
   */
  public closeLiveCodeModal(): void {
    this.showLiveCodeModal = false;
  }

  /**
   * Extracts code information from the AI response content.
   * @param content The response content
   * @returns Object with code flags and code content
   */
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

  /**
   * Angular lifecycle hook. Scrolls the chat container to the bottom after view check.
   */
  public ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  /**
   * Adds a user message and an AI loading message to the messages array and sets isLoading to true.
   * @param prompt The user prompt
   */
  private addUserAndLoadingMessages(prompt: string): void {
    this.messages.push({
      role: 'user',
      content: prompt,
      sender: 'user',
      text: prompt
    });
    this.messages.push({
      role: 'assistant',
      content: '',
      sender: 'ai',
      text: '',
      isLoading: true
    });
    this.isLoading = true;
  }

  /**
   * Enables or disables the prompt input control.
   * @param enable True to enable, false to disable
   */
  private togglePrompt(enable: boolean): void {
    const control = this.chatForm.get('prompt');
    if (enable) {
      control?.enable();
      control?.reset();
    } else {
      control?.disable();
    }
  }

  /**
   * Handles canvas code request from a chat message.
   * @param code The canvas code
   */
  public onCanvasRequested(code: string): void {
    // Actualizar el c��digo del canvas y abrir el modal
    const lastMessage = this.messages[this.messages.length - 1];
    if (lastMessage) {
      lastMessage.canvasCode = code;
    }
    this.openCanvasModal();
  }

  /**
   * Handles live code request from a chat message.
   * @param code The live code
   */
  public onLiveCodeRequested(code: string): void {
    // Actualizar el código live y abrir el modal
    const lastMessage = this.messages[this.messages.length - 1];
    if (lastMessage) {
      lastMessage.liveCode = code;
    }
    this.openLiveCodeModal();
  }

  /**
   * Loads OpenRouter models from the API.
   */
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

  /**
   * Filters OpenRouter models for the selected provider.
   * @param provider The provider name
   */
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

  /**
   * Handles file attachment changes from the file upload component.
   * @param attachments The new attachments
   */
  public onAttachmentsChange(attachments: ChatAttachment[]): void {
    this.currentAttachments = attachments;
  }

  /**
   * Handles file upload errors from the file upload component.
   * @param error The error message
   */
  public onUploadError(error: string): void {
    this.uploadError = error;
    // Hide error after 5 seconds automatically
    setTimeout(() => {
      this.uploadError = '';
    }, 5000);
  }

  /**
   * Automatically adjusts the height of the textarea based on its content.
   * Maximum of 4 lines, then scroll appears.
   * @param event The input event
   */
  public adjustTextareaHeight(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    const lineHeight = 1.5; // rem
    const minHeight = 2.5; // rem - altura mínima (1 línea)
    const maxHeight = 6; // rem - altura máxima (4 líneas)

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';

    // Calculate required height based on scroll height
    const scrollHeight = textarea.scrollHeight;
    const remInPixels = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const requiredHeight = scrollHeight / remInPixels;

    // Set height with min/max constraints
    if (requiredHeight <= maxHeight) {
      textarea.style.height = Math.max(requiredHeight, minHeight) + 'rem';
      textarea.style.overflowY = 'hidden';
    } else {
      textarea.style.height = maxHeight + 'rem';
      textarea.style.overflowY = 'auto';
    }
  }

  /**
   * Handles keyboard events in the textarea.
   * Enter: Sends the message
   * Alt+Enter: New line
   * Shift+Enter: New line
   * @param event The keyboard event
   */
  public onTextareaKeydown(event: KeyboardEvent): void {

    // If Shift+Enter, allow new line
    if(event.shiftKey) {
      return;
    }


    if (event.key === 'Enter') {
      if (event.altKey) {
        // Alt+Enter: Allow new line - do not prevent default
        console.log('Alt+Enter detected - allowing new line');
        return;
      } else {
        // Enter only: Send message - prevent new line and send
        console.log('Enter only detected - sending message');
        event.preventDefault();
        if (!this.chatForm.invalid && !this.isLoading) {
          this.sendMessage();
          // Refocus textarea after sending
          setTimeout(() => {
            const textarea = event.target as HTMLTextAreaElement;
            textarea.focus();
            // Reset height after clearing
            textarea.style.height = '2.5rem';
          }, 0);
        }
      }
    }
  }
}
