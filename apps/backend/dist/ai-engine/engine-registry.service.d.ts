import { AiApiEngine } from './ai-api-engine.base';
export declare class EngineRegistryService {
    private readonly engines;
    constructor(engines: AiApiEngine[]);
    get(provider: string): AiApiEngine | undefined;
    getProviders(): string[];
}
