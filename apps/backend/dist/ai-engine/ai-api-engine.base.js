"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiApiEngine = void 0;
class AiApiEngine {
    async *sendMessageStream(payload) {
        const response = await this.sendMessage(payload);
        yield { content: response.content, done: true };
    }
}
exports.AiApiEngine = AiApiEngine;
//# sourceMappingURL=ai-api-engine.base.js.map