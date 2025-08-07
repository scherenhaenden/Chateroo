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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineRegistryService = void 0;
const common_1 = require("@nestjs/common");
const ai_engine_constants_1 = require("./ai-engine.constants");
let EngineRegistryService = class EngineRegistryService {
    engines = new Map();
    constructor(engines) {
        engines.forEach((engine) => this.engines.set(engine.provider, engine));
    }
    get(provider) {
        return this.engines.get(provider);
    }
    getProviders() {
        return Array.from(this.engines.keys());
    }
};
exports.EngineRegistryService = EngineRegistryService;
exports.EngineRegistryService = EngineRegistryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(ai_engine_constants_1.AI_ENGINES)),
    __metadata("design:paramtypes", [Array])
], EngineRegistryService);
//# sourceMappingURL=engine-registry.service.js.map