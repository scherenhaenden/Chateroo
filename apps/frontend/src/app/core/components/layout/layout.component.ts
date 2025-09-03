import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { ChatSession } from '../../../models/chat.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements OnInit, OnDestroy {
  public readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  public chatSessions: ChatSession[] = [];
  public currentChat: ChatSession | null = null;
  private subscriptions: Subscription[] = [];

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    // Subscribe to chat sessions
    this.subscriptions.push(
      this.chatService.chatSessions$.subscribe(sessions => {
        this.chatSessions = sessions;
      })
    );

    // Subscribe to current chat
    this.subscriptions.push(
      this.chatService.currentChat$.subscribe(chat => {
        this.currentChat = chat;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  public newChat() {
    this.chatService.requestNewChat();
  }

  public switchToChat(chatId: string) {
    this.chatService.switchToChat(chatId);
  }

  public async deleteChat(chatId: string, event: Event): Promise<void> {
    // Prevent the click from bubbling up to the parent (which would switch to the chat)
    event.stopPropagation();

    // Don't allow deleting the last chat
    if (this.chatSessions.length <= 1) {
      return;
    }

    // Show confirmation dialog
    if (confirm('¿Estás seguro de que quieres eliminar este chat? Esta acción no se puede deshacer.')) {
      try {
        await this.chatService.deleteChat(chatId);
      } catch (error) {
        console.error('Error deleting chat:', error);
        alert('Error al eliminar el chat. Por favor, inténtalo de nuevo.');
      }
    }
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    // Bleibe im Chat, auch nach Logout
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }
}
