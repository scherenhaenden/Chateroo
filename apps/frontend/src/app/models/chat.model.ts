export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  provider?: string;
  isLoading?: boolean;
}

