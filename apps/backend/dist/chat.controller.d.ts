import type { Response } from 'express';
import { ChatService } from './chat.service';
export interface SendMessageDto {
    provider: string;
    prompt: string;
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
}
