import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ChatService } from './chat.service';
import { ChatMessage } from '../../models/chat.model';

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ChatService]
    });
    service = TestBed.inject(ChatService);
  });

  it('should create initial chat on construction', () => {
    expect(service).toBeTruthy();

    service.chatSessions$.subscribe(sessions => {
      console.log('Test: Chat sessions:', sessions);
      expect(sessions.length).toBe(1);
      expect(sessions[0].title).toBe('New Chat');
      expect(sessions[0].messages.length).toBe(1);
      expect(sessions[0].messages[0].text).toBe('Welcome! Select a provider and ask a question.');
    });
  });

  it('should add message to current chat and emit currentChat$', (done) => {
    const testMessage: ChatMessage = {
      sender: 'user',
      text: 'Test message'
    };

    // Subscribe to currentChat$ to monitor changes
    let updateCount = 0;
    service.currentChat$.subscribe(chat => {
      console.log('Test: Current chat update', updateCount, chat);
      updateCount++;

      if (updateCount === 1) {
        // Initial chat with welcome message
        expect(chat).toBeTruthy();
        expect(chat!.messages.length).toBe(1);
      } else if (updateCount === 2) {
        // After adding test message
        expect(chat).toBeTruthy();
        expect(chat!.messages.length).toBe(2);
        expect(chat!.messages[1].text).toBe('Test message');
        done();
      }
    });

    // Add message after a small delay to ensure subscription is active
    setTimeout(() => {
      console.log('Test: Adding message to current chat');
      service.addMessageToCurrentChat(testMessage);
    }, 10);
  });

  it('should create new chat and switch to it', (done) => {
    let chatCount = 0;

    service.chatSessions$.subscribe(sessions => {
      console.log('Test: Sessions update', sessions.length);
      chatCount++;

      if (chatCount === 1) {
        expect(sessions.length).toBe(1);
      } else if (chatCount === 2) {
        expect(sessions.length).toBe(2);
        expect(sessions[0].title).toBe('New Chat'); // Newest first
        done();
      }
    });

    setTimeout(() => {
      console.log('Test: Creating new chat');
      service.createNewChat();
    }, 10);
  });
});
