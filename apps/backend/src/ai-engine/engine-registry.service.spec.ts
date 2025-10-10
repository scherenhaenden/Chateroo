import { Test, TestingModule } from '@nestjs/testing';
import { EngineRegistryService } from './engine-registry.service';
import { AiApiEngine } from './ai-api-engine.base';
import { AI_ENGINES } from './ai-engine.constants';

// Mock AiApiEngine for testing purposes
class MockEngine extends AiApiEngine {
  constructor(public readonly provider: string) {
    super();
  }
  sendMessage = jest.fn();
}

describe('EngineRegistryService', () => {
  let service: EngineRegistryService;
  let mockEngine1: MockEngine;
  let mockEngine2: MockEngine;

  beforeEach(async () => {
    mockEngine1 = new MockEngine('provider1');
    mockEngine2 = new MockEngine('provider2');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EngineRegistryService,
        {
          provide: AI_ENGINES,
          useValue: [mockEngine1, mockEngine2],
        },
      ],
    }).compile();

    service = module.get<EngineRegistryService>(EngineRegistryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should register all injected engines', () => {
      expect(service.get('provider1')).toBe(mockEngine1);
      expect(service.get('provider2')).toBe(mockEngine2);
    });
  });

  describe('get', () => {
    it('should return the correct engine for a registered provider', () => {
      const engine = service.get('provider1');
      expect(engine).toBe(mockEngine1);
    });

    it('should return undefined for an unregistered provider', () => {
      const engine = service.get('nonexistent');
      expect(engine).toBeUndefined();
    });
  });

  describe('getEngine', () => {
    it('should be an alias for get and return the correct engine', () => {
      const engine = service.getEngine('provider2');
      expect(engine).toBe(mockEngine2);
    });
  });

  describe('getProviders', () => {
    it('should return an array of all registered provider keys', () => {
      const providers = service.getProviders();
      expect(providers).toHaveLength(2);
      expect(providers).toContain('provider1');
      expect(providers).toContain('provider2');
    });
  });

  describe('getAllProviders', () => {
    it('should be an alias for getProviders and return all keys', () => {
      const providers = service.getAllProviders();
      expect(providers).toEqual(['provider1', 'provider2']);
    });
  });
});
