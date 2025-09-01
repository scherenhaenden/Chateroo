import type { Response } from 'express';
import { ChatService } from './chat.service';
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    attachments?: {
        name: string;
        type: string;
        base64: string;
        size: number;
    }[];
}
export interface SendMessageDto {
    provider: string;
    messages?: ChatMessage[];
    prompt?: string;
    apiKey?: string;
    model?: string;
    stream?: boolean;
    attachments?: {
        name: string;
        type: string;
        base64: string;
        size: number;
    }[];
}
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    sendMessage(payload: SendMessageDto, res: Response, accept?: string): Promise<void>;
    getOpenRouterModels(apiKey?: string): Promise<import("./ai-engine/openrouter.engine").OpenRouterModel[]>;
}
