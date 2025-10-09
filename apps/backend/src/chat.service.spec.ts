import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { EngineRegistryService } from './ai-engine/engine-registry.service';
import { AiApiEngine } from './ai-engine/ai-api-engine.base';
import { SendMessageDto } from './dtos/chat.dto';
import { OpenRouterEngine } from './ai-engine/domains/open-router/services/openrouter.engine';

// Mock AI Engine
class MockAiEngine extends AiApiEngine {
  provider = 'mock-provider';
  sendMessage = jest.fn();
  sendMessageStream = jest.fn();
}

// ADDED: Mock for OpenAI to handle the provider aggregation test case
class MockOpenAiEngine extends AiApiEngine {
    provider = 'openai';
    sendMessage = jest.fn();
}

// Mock OpenRouter Engine
class MockOpenRouterEngine extends OpenRouterEngine {
  constructor() {
    super(null); // Pass null for ConfigService dependency
  }
  listModels = jest.fn();
  listProviders = jest.fn();
}

describe('ChatService', () => {
  let service: ChatService;
  let engineRegistry: EngineRegistryService;
  let mockEngine: MockAiEngine;
  let mockOpenRouterEngine: MockOpenRouterEngine;
  let mockOpenAiEngine: MockOpenAiEngine;

  beforeEach(async () => {
    mockEngine = new MockAiEngine();
    mockOpenRouterEngine = new MockOpenRouterEngine();
    mockOpenAiEngine = new MockOpenAiEngine();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: EngineRegistryService,
          useValue: {
            get: jest.fn((provider: string) => {
              if (provider === 'openrouter') {
                return mockOpenRouterEngine;
              }
              if (provider === 'mock-provider') {
                return mockEngine;
              }
              // ADDED: Handle 'openai' provider
              if (provider === 'openai') {
                  return mockOpenAiEngine;
              }
              return null;
            }),
            // ADDED: Include 'openai' in the list of providers
            getAllProviders: jest.fn(() => ['mock-provider', 'openrouter', 'openai']),
          },
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    engineRegistry = module.get<EngineRegistryService>(EngineRegistryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should get the correct engine and call sendMessage', async () => {
      const payload: SendMessageDto = {
        provider: 'mock-provider',
        prompt: 'Hello',
      };
      const response = { content: 'response' };
      mockEngine.sendMessage.mockResolvedValue(response);

      const result = await service.sendMessage(payload);

      expect(engineRegistry.get).toHaveBeenCalledWith('mock-provider');
      expect(mockEngine.sendMessage).toHaveBeenCalledWith({
        prompt: 'Hello',
        apiKey: undefined,
        model: undefined,
        attachments: undefined,
      });
      expect(result).toEqual(response);
    });

    it('should throw an error for an unsupported provider', async () => {
      // Using try-catch for more explicit async error handling, as `rejects.toThrow` can be unreliable.
      expect.assertions(1);
      const payload: SendMessageDto = {
        provider: 'unsupported',
        prompt: 'Hello',
      };
      try {
        await service.sendMessage(payload);
      } catch (e) {
        expect(e.message).toBe('Provider unsupported not supported');
      }
    });

    it('should extract prompt from messages', async () => {
      const payload: SendMessageDto = {
        provider: 'mock-provider',
        messages: [{ role: 'user', content: 'Message 1' }, { role: 'assistant', content: 'Message 2' }],
      };
      await service.sendMessage(payload);
      expect(mockEngine.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
        prompt: 'Message 1\nMessage 2'
      }));
    });
  });

  describe('sendMessageStream', () => {
    it('should call sendMessageStream on the engine', async () => {
      const payload: SendMessageDto = {
        provider: 'mock-provider',
        prompt: 'Hello',
      };
      const stream = (async function* () {
        yield { content: 'chunk1' };
      })();
      mockEngine.sendMessageStream.mockReturnValue(stream);

      const result = service.sendMessageStream(payload);
      const chunks = [];
      for await (const chunk of result) {
        chunks.push(chunk);
      }

      expect(mockEngine.sendMessageStream).toHaveBeenCalled();
      expect(chunks).toEqual([{ content: 'chunk1' }]);
    });
  });

  describe('Provider and Model Functions', () => {
    it('getOpenRouterModels should call listModels on OpenRouterEngine', async () => {
      const models = [{ id: 'model1', name: 'Model 1' }];
      mockOpenRouterEngine.listModels.mockResolvedValue(models as any);

      const result = await service.getOpenRouterModels('api-key');

      expect(engineRegistry.get).toHaveBeenCalledWith('openrouter');
      expect(mockOpenRouterEngine.listModels).toHaveBeenCalledWith('api-key');
      expect(result).toEqual(models);
    });

    it('getAvailableProviders should return a formatted list of providers', async () => {
      const providers = await service.getAvailableProviders();
      expect(providers).toEqual([
        {
          id: 'mock-provider',
          name: 'Mock-provider',
          description: 'mock-provider AI provider',
          requiresApiKey: false,
          supportsModels: true,
        },
        {
          id: 'openrouter',
          name: 'OpenRouter',
          description: 'Multiple AI providers via OpenRouter',
          requiresApiKey: true,
          supportsModels: true,
        },
        // ADDED: Include openai in the expected output
        {
            id: 'openai',
            name: 'OpenAI',
            description: 'OpenAI GPT models',
            requiresApiKey: true,
            supportsModels: true,
        }
      ]);
    });

    it('getModelsForProviders should aggregate models from multiple providers', async () => {
      const openRouterModels = [{ id: 'or-model', name: 'OR Model', provider: 'openrouter' }];
      mockOpenRouterEngine.listModels.mockResolvedValue(openRouterModels as any);

      // For 'openai', it will return a static list.
      const result = await service.getModelsForProviders(['openrouter', 'openai'], 'api-key');

      expect(result.openrouter).toEqual(openRouterModels);
      expect(result.openai.length).toBeGreaterThan(0);
      expect(result.openai[0]).toHaveProperty('id');
    });
  });
});