import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ChatService } from './core/services/chat.service';
import { ChatMessage } from './models/chat.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  chatForm!: FormGroup;
  messages: ChatMessage[] = [];
  isLoading = false;

  constructor(private fb: FormBuilder, private chatService: ChatService) {}

  /**
   * Initializes the chat form with default values and adds a greeting message.
   */
  ngOnInit(): void {
    this.chatForm = this.fb.group({
      provider: ['lm-studio', Validators.required],
      prompt: ['', Validators.required],
      apiKey: [''],
    });

    // Begrüßungsnachricht
    this.messages.push({
      sender: 'ai',
      text: 'Hallo! Wähle einen Provider und stelle eine Frage.',
    });
  }

  /**
   * Sends a message from the user to the chat service and processes the response.
   *
   * The function first checks if the chat form is valid. If not, it returns early.
   * It then extracts the form value, creates a user message, and adds it to the messages array.
   * A loading message is added to indicate that the AI is processing the request.
   * The chat form's prompt field is disabled during this time.
   *
   * The function subscribes to the chat service's sendMessage method. Upon receiving
   * a response, it replaces the loading message with the actual response from the AI,
   * re-enables the prompt field, and resets its value. In case of an error, it replaces
   * the loading message with an error message and performs similar cleanup actions.
   */
  sendMessage(): void {
    if (this.chatForm.invalid) return;

    const formValue = this.chatForm.value;
    const userMessage: ChatMessage = { sender: 'user', text: formValue.prompt };
    this.messages.push(userMessage);
    const loadingMessage: ChatMessage = { sender: 'ai', text: '', isLoading: true };
    this.messages.push(loadingMessage);
    this.isLoading = true;
    this.chatForm.get('prompt')?.disable();

    this.chatService.sendMessage(formValue).subscribe({
      next: (res) => {
        // Ersetze die Lade-Nachricht mit der echten Antwort
        const lastMessageIndex = this.messages.length - 1;
        this.messages[lastMessageIndex] = { sender: 'ai', text: res.content };
        this.isLoading = false;
        this.chatForm.get('prompt')?.enable();
        this.chatForm.get('prompt')?.reset();
      },
      error: (err) => {
        const errorMessage = `Fehler: ${err.error?.message || 'Kommunikation mit dem Backend fehlgeschlagen.'}`;
        const lastMessageIndex = this.messages.length - 1;
        this.messages[lastMessageIndex] = { sender: 'ai', text: errorMessage };
        this.isLoading = false;
        this.chatForm.get('prompt')?.enable();
      },
    });
  }
}

