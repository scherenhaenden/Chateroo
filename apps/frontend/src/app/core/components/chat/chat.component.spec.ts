import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError, BehaviorSubject, Subject } from 'rxjs';
import { ChatComponent } from './chat.component';
import { ChatService } from '../../services/chat.service';
import { SettingsService } from '../../services/settings.service';
import { ChatSession, ChatMessage } from '../../../models/chat.model';
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

// Stub components to satisfy the template
@Component({ selector: 'app-chat-message', template: '', standalone: true })
class StubChatMessageComponent { @Input() message!: ChatMessage; }

@Component({ selector: 'app-canvas', template: '', standalone: true })
class StubCanvasComponent { @Input() code!: string; }

@Component({ selector: 'app-live-code', template: '', standalone: true })
class StubLiveCodeComponent { @Input() code!: string; }

@Component({ selector: 'app-file-upload', template: '', standalone: true })
class StubFileUploadComponent {}

@Component({ selector: 'app-openrouter-selector', template: '', standalone: true })
class StubOpenRouterSelectorComponent {}


// Mock Services
class MockChatService {
  private currentChat = new BehaviorSubject<ChatSession | null>(null);
  currentChat$ = this.currentChat.asObservable();
  newChatRequested$ = new Subject<void>().asObservable();

  addMessageToCurrentChat = jest.fn();
  updateLastMessageInCurrentChat = jest.fn();
  sendMessage = jest.fn().mockReturnValue(of({ content: 'Mock response' }));
  prepareMessagesForAPI = jest.fn(messages => messages);
  getCurrentChat = jest.fn(() => this.currentChat.value);

  setCurrentChat(session: ChatSession) {
    this.currentChat.next(session);
  }
}

class MockSettingsService {
  load = jest.fn().mockResolvedValue(undefined);
  getApiKey = jest.fn().mockReturnValue(null);
}

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;
  let chatService: MockChatService;
  let settingsService: MockSettingsService;

  const mockChatSession: ChatSession = {
    id: '1',
    title: 'Test Chat',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        ReactiveFormsModule,
        ChatComponent,
        // Import stubs
        StubChatMessageComponent,
        StubCanvasComponent,
        StubLiveCodeComponent,
        StubFileUploadComponent,
        StubOpenRouterSelectorComponent
      ],
      providers: [
        { provide: ChatService, useClass: MockChatService },
        { provide: SettingsService, useClass: MockSettingsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    chatService = TestBed.inject(ChatService) as unknown as MockChatService;
    settingsService = TestBed.inject(SettingsService) as unknown as MockSettingsService;

    // Set an initial chat session for tests
    chatService.setCurrentChat(mockChatSession);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should subscribe to the current chat and update messages', () => {
    const messages: ChatMessage[] = [{ role: 'user', content: 'hello' }];
    chatService.setCurrentChat({ ...mockChatSession, messages });
    fixture.detectChanges();
    expect(component.messages).toEqual(messages);
  });

  describe('sendMessage', () => {
    beforeEach(() => {
      component['chatForm'].setValue({
        provider: 'test',
        openRouterProvider: '',
        model: '',
        apiKey: '',
        prompt: 'A test prompt',
      });
    });

    it('should add user and loading messages', fakeAsync(() => {
      component.sendMessage();
      tick();

      expect(chatService.addMessageToCurrentChat).toHaveBeenCalledTimes(2);
      expect(chatService.addMessageToCurrentChat.mock.calls[0][0]).toMatchObject({
        role: 'user',
        content: 'A test prompt',
      });
      expect(chatService.addMessageToCurrentChat.mock.calls[1][0]).toMatchObject({
        role: 'assistant',
        isLoading: true,
      });
    }));

    it('should call chatService.sendMessage on success', fakeAsync(() => {
        component.sendMessage();
        tick();
        expect(chatService.sendMessage).toHaveBeenCalled();
        expect(chatService.updateLastMessageInCurrentChat).toHaveBeenCalledWith(
            expect.objectContaining({ content: 'Mock response', isLoading: false })
        );
    }));

    it('should handle API errors gracefully', fakeAsync(() => {
        const errorResponse = { error: { message: 'API failed' } };
        chatService.sendMessage.mockReturnValue(throwError(() => errorResponse));

        component.sendMessage();
        tick();

        expect(chatService.sendMessage).toHaveBeenCalled();
        expect(chatService.updateLastMessageInCurrentChat).toHaveBeenCalledWith(
            expect.objectContaining({ content: expect.stringContaining('Failed to communicate'), isLoading: false })
        );
    }));

    it('should disable the prompt while loading and re-enable it after completion', fakeAsync(() => {
        const promptControl = component['chatForm'].get('prompt');
        expect(promptControl?.enabled).toBe(true);

        component.sendMessage();
        tick();

        expect(promptControl?.disabled).toBe(true);

        // Wait for the API call to complete
        tick();

        expect(promptControl?.enabled).toBe(true);
    }));
  });

  it('should toggle canvas and live code modals', () => {
    expect(component.showCanvasModal).toBe(false);
    component.openCanvasModal();
    expect(component.showCanvasModal).toBe(true);
    component.closeCanvasModal();
    expect(component.showCanvasModal).toBe(false);

    expect(component.showLiveCodeModal).toBe(false);
    component.openLiveCodeModal();
    expect(component.showLiveCodeModal).toBe(true);
    component.closeLiveCodeModal();
    expect(component.showLiveCodeModal).toBe(false);
  });
});