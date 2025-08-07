import { Inject, Injectable } from '@nestjs/common';
import { AiApiEngine } from './ai-api-engine.base';
import { AI_ENGINES } from './ai-engine.constants';

@Injectable()
export class EngineRegistryService {
  private readonly engines = new Map<string, AiApiEngine>();

  public constructor(@Inject(AI_ENGINES) engines: AiApiEngine[]) {
    engines.forEach((engine) => this.engines.set(engine.provider, engine));
  }

  public get(provider: string): AiApiEngine | undefined {
    return this.engines.get(provider);
  }

  public getProviders(): string[] {
    return Array.from(this.engines.keys());
  }
}
