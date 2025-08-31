export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  base64?: string;
  isImage: boolean;
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  provider?: string;
  isLoading?: boolean;
  hasCanvas?: boolean;
  hasLiveCode?: boolean;
  canvasCode?: string;
  liveCode?: string;
  attachments?: ChatAttachment[];
}

export interface ChatOptions {
  canvasEnabled: boolean;
  liveCodeEnabled: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}
