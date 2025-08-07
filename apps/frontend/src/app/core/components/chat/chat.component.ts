import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { ChatService, SendMessagePayload, ChatApiResponse } from '../../services/chat.service';
import { SettingsService } from '../../services/settings.service';
import { ChatMessage } from '../../../models/chat.model';

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

  /**
   * Checks if the given provider requires an API key.
   */
  public requiresApiKey(provider: string | null | undefined): boolean {
    return provider ? this.providersWithApiKey.includes(provider) : false;
  }

  /**
   * Initializes the component by loading settings, setting up form validators,
   * and pushing an initial message to the chat messages array.
   */
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

  /**
   * Sends a message to the chat service with the provided form values.
   *
   * This function first checks if the chat form is valid. If it's invalid, the function returns immediately.
   * It then retrieves the form values and adds user and loading messages.
   * The prompt visibility is toggled off after sending the message.
   * An API key is determined either from the form value or fetched from the settings service based on the provider.
   * A payload object is created with the necessary details and sent to the chat service.
   * Success and error handlers are defined for the service response.
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

  /**
   * Adds a user message and an AI loading message to the messages array and sets isLoading to true.
   */
  private addUserAndLoadingMessages(prompt: string): void {
    this.messages.push({ sender: 'user', text: prompt });
    this.messages.push({ sender: 'ai', text: '', isLoading: true });
    this.isLoading = true;
  }

  /**
   * Toggles the 'prompt' field in the chat form based on the enable flag.
   *
   * This function checks if the 'prompt' field is present in the chat form.
   * If enabled, it enables the field and resets its value. If disabled, it simply disables the field.
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
   * Handles a successful API response by updating the last message and UI state.
   */
  private handleSuccess(res: ChatApiResponse): void {
    const lastIndex = this.messages.length - 1;
    this.messages[lastIndex] = { sender: 'ai', text: res.content };
    this.isLoading = false;
    this.togglePrompt(true);
  }

  /**
   * Handles errors by updating the messages array with an error message and resetting loading state.
   */
  private handleError(err: any): void {
    const errorMessage = `Error: ${err.error?.message || 'Failed to communicate with the backend.'}`;
    const lastIndex = this.messages.length - 1;
    this.messages[lastIndex] = { sender: 'ai', text: errorMessage };
    this.isLoading = false;
    this.togglePrompt(true);
  }
}

