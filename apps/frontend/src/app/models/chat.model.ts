export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  provider?: string;
  isLoading?: boolean;
  hasCanvas?: boolean;
  hasLiveCode?: boolean;
  canvasCode?: string;
  liveCode?: string;
}

export interface ChatOptions {
  canvasEnabled: boolean;
  liveCodeEnabled: boolean;
}
