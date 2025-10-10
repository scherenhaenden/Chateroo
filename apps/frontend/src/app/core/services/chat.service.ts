import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChatSession, ChatMessage } from '../../models/chat.model';
import { ChatSessionStorageService } from './chat-session-storage.service';
import { OpenRouterModel, OpenRouterProvider } from '../../models/openrouter.model';

export interface SendMessagePayload {
  provider: string;
  messages: ChatMessage[]; // Complete conversation history
  apiKey?: string;
  model?: string;
  stream?: boolean;
  // Legacy support for single prompt
  prompt?: string;
  attachments?: {
    name: string;
    type: string;
    base64: string;
    size: number;
  }[];
}

export interface ChatApiResponse {
  content: string;
}

// Interface für Streaming-Events
export interface StreamEvent {
  content: string;
  done?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private apiUrl = 'http://localhost:3000/api/chat';
  private newChatSubject = new Subject<void>();

  // Chat Management
  private chatSessions: ChatSession[] = [];
  private currentChatId: string | null = null;
  private chatSessionsSubject = new BehaviorSubject<ChatSession[]>([]);
  private currentChatSubject = new BehaviorSubject<ChatSession | null>(null);

  // Flag to prevent multiple initializations
  private isInitialized = false;

  public newChatRequested$ = this.newChatSubject.asObservable();
  public chatSessions$ = this.chatSessionsSubject.asObservable();
  public currentChat$ = this.currentChatSubject.asObservable();

  public constructor(
    private http: HttpClient,
    private chatStorage: ChatSessionStorageService
  ) {
    // Wait a bit to ensure IndexedDB is ready, then initialize
    setTimeout(() => {
      this.initializeChats();
    }, 100);
  }

  private async initializeChats(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Get saved sessions
      const savedSessions = await this.chatStorage.getAllSessions();
      console.log('Loaded saved sessions:', savedSessions.length);

      if (savedSessions.length > 0) {
        // Load existing sessions
        this.chatSessions = savedSessions;
        this.chatSessionsSubject.next([...this.chatSessions]);

        // Set current chat to most recent
        this.currentChatId = savedSessions[0].id;
        this.currentChatSubject.next(savedSessions[0]);
        console.log('Loaded current chat:', savedSessions[0].title);
      } else {
        // Create first chat only if no sessions exist
        console.log('No saved sessions found, creating first chat');
        this.createFirstChat();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing chats:', error);
      if (!this.isInitialized) {
        this.createFirstChat();
        this.isInitialized = true;
      }
    }
  }

  private createFirstChat(): void {
    const firstChat: ChatSession = {
      id: this.generateChatId(),
      title: 'New Chat',
      messages: [{
        role: 'assistant',
        content: 'Welcome! Select a provider and ask a question.',
        sender: 'ai',
        text: 'Welcome! Select a provider and ask a question.'
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.chatSessions = [firstChat];
    this.currentChatId = firstChat.id;
    this.chatSessionsSubject.next([...this.chatSessions]);
    this.currentChatSubject.next(firstChat);

    // Save to IndexedDB
    this.chatStorage.saveSession(firstChat);
  }

  public createNewChat(): ChatSession {
    const newChat: ChatSession = {
      id: this.generateChatId(),
      title: 'New Chat',
      messages: [{
        role: 'assistant',
        content: 'Welcome! Select a provider and ask a question.',
        // Legacy UI fields
        sender: 'ai',
        text: 'Welcome! Select a provider and ask a question.'
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.chatSessions.unshift(newChat); // Add to beginning of array
    this.currentChatId = newChat.id;
    this.chatSessionsSubject.next([...this.chatSessions]);
    this.currentChatSubject.next(newChat);

    // Save to IndexedDB
    this.chatStorage.saveSession(newChat);

    return newChat;
  }

  public switchToChat(chatId: string): void {
    const chat = this.chatSessions.find(c => c.id === chatId);
    if (chat) {
      this.currentChatId = chatId;
      this.currentChatSubject.next(chat);
    }
  }

  public getCurrentChat(): ChatSession | null {
    if (!this.currentChatId) return null;
    return this.chatSessions.find(c => c.id === this.currentChatId) || null;
  }

  public addMessageToCurrentChat(message: ChatMessage): void {
    const currentChat = this.getCurrentChat();
    if (currentChat) {
      // Ensure message has both new format (role/content) and legacy format (sender/text) for UI compatibility
      const normalizedMessage: ChatMessage = {
        ...message,
        role: message.role || (message.sender === 'user' ? 'user' : 'assistant'),
        content: message.content || message.text || '',
        sender: message.sender || (message.role === 'user' ? 'user' : 'ai'),
        text: message.text || message.content || ''
      };

      currentChat.messages.push(normalizedMessage);
      currentChat.updatedAt = new Date();

      // Update title based on first user message
      if (normalizedMessage.role === 'user' && currentChat.title === 'New Chat' && normalizedMessage.content.length > 0) {
        currentChat.title = normalizedMessage.content.length > 50
          ? normalizedMessage.content.substring(0, 50) + '...'
          : normalizedMessage.content;
      }

      this.chatSessionsSubject.next([...this.chatSessions]);
      this.currentChatSubject.next(currentChat);

      // AUTO-SAVE: Save to IndexedDB whenever a message is added
      this.chatStorage.saveSession(currentChat);
    }
  }

  public updateLastMessageInCurrentChat(message: Partial<ChatMessage>): void {
    const currentChat = this.getCurrentChat();
    if (currentChat && currentChat.messages.length > 0) {
      // Create new message object instead of mutating existing one for Angular change detection
      const lastMessageIndex = currentChat.messages.length - 1;
      const lastMessage = currentChat.messages[lastMessageIndex];
      currentChat.messages[lastMessageIndex] = { ...lastMessage, ...message };
      currentChat.updatedAt = new Date();
      this.chatSessionsSubject.next([...this.chatSessions]);
      this.currentChatSubject.next({ ...currentChat });

      // AUTO-SAVE: Save to IndexedDB whenever a message is updated
      this.chatStorage.saveSession(currentChat);
    }
  }

  /**
   * Deletes a chat session by ID
   */
  public async deleteChat(chatId: string): Promise<void> {
    // Remove from memory
    this.chatSessions = this.chatSessions.filter(chat => chat.id !== chatId);
    this.chatSessionsSubject.next([...this.chatSessions]);

    // If we deleted the current chat, switch to another or create new one
    if (this.currentChatId === chatId) {
      if (this.chatSessions.length > 0) {
        this.switchToChat(this.chatSessions[0].id);
      } else {
        this.createNewChat();
      }
    }

    // Remove from IndexedDB
    await this.chatStorage.deleteSession(chatId);
  }

  public requestNewChat(): void {
    this.createNewChat();
    this.newChatSubject.next();
  }

  private generateChatId(): string {
    return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Sends a message to the backend with the provided payload (non-streaming).
   */
  public sendMessage(payload: SendMessagePayload): Observable<ChatApiResponse> {
    return this.http.post<ChatApiResponse>(this.apiUrl, payload);
  }

  /**
   * Sends a message with streaming support using Server-Sent Events
   */
  public sendMessageStream(payload: SendMessagePayload): Observable<StreamEvent> {
    return new Observable<StreamEvent>((observer) => {
      this.streamWithFetch({ ...payload, stream: true }, observer);

      return () => {
        // Cleanup function
      };
    });
  }

  private async streamWithFetch(payload: SendMessagePayload, observer: any) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          observer.next({ content: '', done: true });
          observer.complete();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;

          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              observer.next({ content: '', done: true });
              observer.complete();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                observer.next({ content: parsed.content });
              } else if (parsed.error) {
                observer.error(new Error(parsed.error));
                return;
              }
            } catch (e) {
              // If it's not JSON, treat it as plain text content
              if (data && data !== '[DONE]') {
                observer.next({ content: data });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      observer.error(error);
    }
  }

  public getOpenRouterModels(apiKey: string): Observable<OpenRouterModel[]> {
    return this.http.get<OpenRouterModel[]>(`${this.apiUrl}/openrouter/models`, {
      params: { apiKey },
    });
  }

  public getOpenRouterProviders(): Observable<OpenRouterProvider[]> {
    return this.http.get<OpenRouterProvider[]>(`${this.apiUrl}/openrouter/providers`);
  }

  /**
   * Prepares messages for API in OpenAI format, filtering out UI-only messages
   */
  public prepareMessagesForAPI(messages: ChatMessage[]): ChatMessage[] {
    return messages
      .filter(msg => msg.role !== undefined && msg.content !== undefined && msg.content.trim() !== '')
      .filter(msg => !msg.isLoading) // Exclude loading messages
      .map(msg => ({
        role: msg.role!,
        content: msg.content!
        // Note: Attachments are handled separately in the payload to avoid type conflicts
        // The original ChatAttachment format requires id, url, isImage which are UI-specific
      }));
  }

  /**
   * Get all available AI providers from the backend.
   * Returns metadata about each provider including capabilities.
   */
  public getAvailableProviders(): Observable<Array<{
    id: string;
    name: string;
    description: string;
    requiresApiKey: boolean;
    supportsModels: boolean;
  }>> {
    return this.http.get<Array<{
      id: string;
      name: string;
      description: string;
      requiresApiKey: boolean;
      supportsModels: boolean;
    }>>(`${this.apiUrl}/providers`);
  }

  /**
   * Get models for specific AI provider(s), grouped by provider.
   * This method allows fetching models for one or multiple providers.
   *
   * @param providers Array of provider IDs (e.g., ['openai', 'openrouter'])
   * @param apiKey Optional API key for providers that require authentication
   * @returns Observable of models grouped by provider ID
   */
  public getModelsForProviders(
    providers: string[],
    apiKey?: string
  ): Observable<Record<string, Array<{
    id: string;
    name: string;
    description?: string;
    context_length?: number;
    provider: string;
  }>>> {
    const params: { [key: string]: string } = {
      providers: providers.join(',')
    };

    if (apiKey) {
      params['apiKey'] = apiKey;
    }

    return this.http.get<Record<string, Array<{
      id: string;
      name: string;
      description?: string;
      context_length?: number;
      provider: string;
    }>>>(`${this.apiUrl}/models`, { params });
  }

  /**
   * Convenience method to get models for a single provider.
   *
   * @param provider Single provider ID (e.g., 'openai')
   * @param apiKey Optional API key for providers that require authentication
   * @returns Observable of models for the specified provider
   */
  public getModelsForProvider(
    provider: string,
    apiKey?: string
  ): Observable<Array<{
    id: string;
    name: string;
    description?: string;
    context_length?: number;
    provider: string;
  }>> {
    return this.getModelsForProviders([provider], apiKey).pipe(
      map(result => result[provider] || [])
    );
  }
}
