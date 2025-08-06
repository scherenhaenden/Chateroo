import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ChatService, SendMessagePayload } from './core/services/chat.service';
import { SettingsService } from './core/services/settings.service';
import { ChatMessage } from './models/chat.model';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

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
    // Load settings first
    await this.settingsService.load();
    const currentSettings = this.settingsService.getSettings();

    // Initialize forms
    this.chatForm = this.fb.group({
      provider: ['lm-studio', Validators.required],
      prompt: ['', Validators.required],
    });

    this.settingsForm = this.fb.group({
      openAiApiKey: [currentSettings.openAiApiKey || ''],
    });

    // Welcome message
    this.messages.push({
      sender: 'ai',
      text: 'Hello! Select a provider and ask a question.',
    });
  }

  // --- View Management ---
  setActiveView(view: 'chat' | 'settings'): void {
    this.activeView = view;
  }

  // --- Settings Logic ---
  async saveSettings(): Promise<void> {
    if (this.settingsForm.invalid) return;
    await this.settingsService.save(this.settingsForm.value);
    alert('Settings saved!'); // In a real app, use a nicer notification
  }

  // --- Chat Logic ---
  sendMessage(): void {
    if (this.chatForm.invalid) return;

    const formValue = this.chatForm.value;
    const userMessage: ChatMessage = { sender: 'user', text: formValue.prompt };
    this.messages.push(userMessage);

    const loadingMessage: ChatMessage = { sender: 'ai', text: '', isLoading: true };
    this.messages.push(loadingMessage);

    this.isLoading = true;
    this.chatForm.get('prompt')?.disable();

    // Retrieve API key if needed
    const apiKey = this.settingsService.getApiKey(formValue.provider);

    const payload: SendMessagePayload = {
      provider: formValue.provider,
      prompt: formValue.prompt,
      apiKey: apiKey || undefined,
    };

    this.chatService.sendMessage(payload).subscribe({
      next: (res) => {
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
