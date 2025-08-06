import { OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ChatPayload, ChatResponse } from './ai-engine/ai-api-engine.base';
export declare class ChatService implements OnModuleInit {
    private moduleRef;
    private engines;
    constructor(moduleRef: ModuleRef);
    onModuleInit(): void;
    handleMessage(provider: string, payload: ChatPayload): Promise<ChatResponse>;
    getProviders(): string[];
}
