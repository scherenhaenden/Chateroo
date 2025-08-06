import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// App Services and Models
import { ChatService, SendMessagePayload } from './core/services/chat.service';
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
  activeView: 'chat' | 'settings' = 'chat';
  isLoading = false;

  // Reactive Forms
  chatForm!: FormGroup;
  settingsForm!: FormGroup;

  // Chat Data
  messages: ChatMessage[] = [];

  constructor(
    private fb: FormBuilder,
    private chatService: ChatService,
    private settingsService: SettingsService
  ) {}

  async ngOnInit(): Promise<void> {
    // Load settings from persistent storage first
    await this.settingsService.load();
    const currentSettings = this.settingsService.getSettings();

    // Initialize the chat form
    this.chatForm = this.fb.group({
      provider: ['lm-studio', Validators.required],
      prompt: ['', Validators.required],
    });

    // Initialize the settings form with loaded data
    this.settingsForm = this.fb.group({
      openAiApiKey: [currentSettings.openAiApiKey || ''],
    });

    // Display a welcome message
    this.messages.push({
      sender: 'ai',
      text: 'Welcome! Select a provider and ask a question.',
    });
  }

  /**
   * Switches the main view between 'chat' and 'settings'.
   */
  setActiveView(view: 'chat' | 'settings'): void {
    this.activeView = view;
  }

  /**
   * Saves the current values from the settings form to persistent storage.
   */
  async saveSettings(): Promise<void> {
    if (this.settingsForm.invalid) return;
    await this.settingsService.save(this.settingsForm.value);
    alert('Settings saved!'); // In a real app, this would be a toast notification
  }

  /**
   * Sends the user's message to the selected AI provider.
   */
  sendMessage(): void {
    if (this.chatForm.invalid) return;

    const formValue = this.chatForm.value;

    // Add user message and a loading indicator to the chat
    this.messages.push({ sender: 'user', text: formValue.prompt });
    this.messages.push({ sender: 'ai', text: '', isLoading: true });

    this.isLoading = true;
    this.chatForm.get('prompt')?.disable();

    // Retrieve the API key from settings if the provider is OpenAI
    const apiKey = this.settingsService.getApiKey(formValue.provider);

    const payload: SendMessagePayload = {
      provider: formValue.provider,
      prompt: formValue.prompt,
      apiKey: apiKey || undefined, // Only send the key if it exists
    };

    this.chatService.sendMessage(payload).subscribe({
      next: (res) => {
        // Replace loading message with the actual AI response
        const lastIndex = this.messages.length - 1;
        this.messages[lastIndex] = { sender: 'ai', text: res.content };
        this.isLoading = false;
        this.chatForm.get('prompt')?.enable();
        this.chatForm.get('prompt')?.reset();
      },
      error: (err) => {
        const errorMessage = `Error: ${err.error?.message || 'Failed to communicate with the backend.'}`;
        const lastIndex = this.messages.length - 1;
        this.messages[lastIndex] = { sender: 'ai', text: errorMessage };
        this.isLoading = false;
        this.chatForm.get('prompt')?.enable();
      },
    });
  }
}