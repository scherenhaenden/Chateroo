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

