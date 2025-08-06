import { AiApiEngine, ChatPayload, ChatResponse } from './ai-api-engine.base';
export declare class DummyEngine extends AiApiEngine {
    readonly provider = "dummy";
    sendMessage(payload: ChatPayload): Promise<ChatResponse>;
}
