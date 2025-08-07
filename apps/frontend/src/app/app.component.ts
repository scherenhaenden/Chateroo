import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// App Services and Models
import { ChatService, SendMessagePayload, ChatApiResponse } from './core/services/chat.service';
import { SettingsService } from './core/services/settings.service';
import { ChatMessage } from './models/chat.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  // State Management
  public activeView: 'chat' | 'settings' = 'chat';
  public isLoading = false;

  // Reactive Forms
  public chatForm!: FormGroup;
  public settingsForm!: FormGroup;

  // Chat Data
  public messages: ChatMessage[] = [];

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
    // Initialize forms immediately in constructor
    this.chatForm = this.fb.group({
      provider: ['lm-studio', Validators.required],
      apiKey: [''],
      prompt: ['', Validators.required],
    });

    this.settingsForm = this.fb.group({
      openAiApiKey: [''],
    });
  }

  public requiresApiKey(provider: string | null | undefined): boolean {
    return provider ? this.providersWithApiKey.includes(provider) : false;
  }

  /**
   * Initializes the component by loading settings, setting up forms with validation,
   * and displaying a welcome message.
   *
   * The function performs the following steps:
   * 1. Loads settings from persistent storage using `settingsService`.
   * 2. Updates the settings form with data from the loaded settings.
   * 3. Sets up dynamic validation for the API key based on the selected provider in the chat form.
   * 4. Adds a welcome message to the messages array.
   */
  public async ngOnInit(): Promise<void> {
    // Load settings and update forms
    await this.settingsService.load();
    const currentSettings = this.settingsService.getSettings();

    // Update settings form with loaded data
    this.settingsForm.patchValue({
      openAiApiKey: currentSettings.openAiApiKey || ''
    });

    // Set up dynamic validation for API key
    this.chatForm.get('provider')?.valueChanges.subscribe((provider) => {
      const apiKeyControl = this.chatForm.get('apiKey');
      if (this.providersWithApiKey.includes(provider)) {
        apiKeyControl?.setValidators([Validators.required]);
      } else {
        apiKeyControl?.clearValidators();
      }
      apiKeyControl?.updateValueAndValidity();
    });

    // Display welcome message
    this.messages.push({
      sender: 'ai',
      text: 'Welcome! Select a provider and ask a question.',
    });
  }

  /**
   * Sets the active view to either 'chat' or 'settings'.
   */
  public setActiveView(view: 'chat' | 'settings'): void {
    this.activeView = view;
  }

  /**
   * Saves valid settings from the form to persistent storage and alerts the user.
   */
  public async saveSettings(): Promise<void> {
    if (this.settingsForm.invalid) return;
    await this.settingsService.save(this.settingsForm.value);
    alert('Settings saved!'); // In a real app, this would be a toast notification
  }

  /**
   * Sends the user's message to the selected AI provider.
   *
   * This function validates the chat form, retrieves its value, and adds a user message along with a loading indicator to the chat messages. It disables the input field during the process. The API key is fetched from the settings service if the provider is OpenAI. A payload is constructed and sent to the chat service. Upon receiving a response, the loading indicator is replaced with the AI's response, and the form is re-enabled and reset. In case of an error, an error message is displayed in place of the loading indicator.
   */
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
