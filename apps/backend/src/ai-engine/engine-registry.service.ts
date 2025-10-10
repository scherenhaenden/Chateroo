import { Inject, Injectable } from '@nestjs/common';
import { AiApiEngine } from './ai-api-engine.base';
import { AI_ENGINES } from './ai-engine.constants';

@Injectable()
export class EngineRegistryService {
  private readonly engines = new Map<string, AiApiEngine>();

  public constructor(@Inject(AI_ENGINES) engines: AiApiEngine[]) {
    engines.forEach((engine) => this.engines.set(engine.provider, engine));
  }

  /**
   * Retrieves an AI API engine by provider name.
   */
  public get(provider: string): AiApiEngine | undefined {
    return this.engines.get(provider);
  }

  /**
   * Retrieves an AI API engine by provider name (alias for get method).
   */
  public getEngine(provider: string): AiApiEngine | undefined {
    return this.engines.get(provider);
  }

  /**
   * Returns an array of provider keys.
   */
  public getProviders(): string[] {
    return Array.from(this.engines.keys());
  }

  /**
   * Returns an array of all registered provider keys (alias for getProviders).
   * Used by ChatService for listing all available AI providers.
   */
  public getAllProviders(): string[] {
    return this.getProviders();
  }
}
