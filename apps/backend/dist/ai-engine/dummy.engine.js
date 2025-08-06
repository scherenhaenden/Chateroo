"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DummyEngine = void 0;
const common_1 = require("@nestjs/common");
const ai_api_engine_base_1 = require("./ai-api-engine.base");
let DummyEngine = class DummyEngine extends ai_api_engine_base_1.AiApiEngine {
    provider = 'dummy';
    async sendMessage(payload) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return {
            content: `Antwort vom Dummy-Provider für die Frage: "${payload.prompt}"`,
        };
    }
};
exports.DummyEngine = DummyEngine;
exports.DummyEngine = DummyEngine = __decorate([
    (0, common_1.Injectable)()
], DummyEngine);
//# sourceMappingURL=dummy.engine.js.map