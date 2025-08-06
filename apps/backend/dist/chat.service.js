"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const dummy_engine_1 = require("./ai-engine/dummy.engine");
const openai_engine_1 = require("./ai-engine/openai.engine");
const lm_studio_engine_1 = require("./ai-engine/lm-studio.engine");
let ChatService = class ChatService {
    moduleRef;
    engines = new Map();
    constructor(moduleRef) {
        this.moduleRef = moduleRef;
    }
    onModuleInit() {
        const engineImplementations = [dummy_engine_1.DummyEngine, openai_engine_1.OpenAiEngine, lm_studio_engine_1.LmStudioEngine];
        engineImplementations.forEach((engineClass) => {
            const engineInstance = this.moduleRef.get(engineClass, { strict: false });
            this.engines.set(engineInstance.provider, engineInstance);
        });
    }
    async handleMessage(provider, payload) {
        const engine = this.engines.get(provider);
        if (!engine) {
            throw new common_1.NotFoundException(`Provider '${provider}' wird nicht unterstützt.`);
        }
        return engine.sendMessage(payload);
    }
    getProviders() {
        return Array.from(this.engines.keys());
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.ModuleRef])
], ChatService);
//# sourceMappingURL=chat.service.js.map