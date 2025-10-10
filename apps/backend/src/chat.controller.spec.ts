import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dtos/chat.dto';
import { Response } from 'express';
import { EngineRegistryService } from './ai-engine/engine-registry.service';
import { AiApiEngine } from './ai-engine/ai-api-engine.base';
import { ConfigService } from '@nestjs/config';

// Mock ChatService
const mockChatService = {
  sendMessage: jest.fn(),
  sendMessageStream: jest.fn(),
  getOpenRouterModels: jest.fn(),
  getOpenRouterProviders: jest.fn(),
  getAvailableProviders: jest.fn(),
  getModelsForProviders: jest.fn(),
};

describe('ChatController', () => {
  let controller: ChatController;
  let chatService: ChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: mockChatService,
        },
        // Mock EngineRegistryService and its dependencies as they are used by ChatService, even if ChatService is mocked.
        // This is to prevent NestJS from throwing errors about missing providers.
        {
          provide: EngineRegistryService,
          useValue: {
            get: jest.fn(),
            register: jest.fn(),
            getAllProviders: jest.fn(),
          },
        },
        // Provide mock implementations for all engines to satisfy the dependency graph
        { provide: 'DummyEngine', useValue: {} },
        { provide: 'LmStudioEngine', useValue: {} },
        { provide: 'OpenAiEngine', useValue: {} },
        { provide: 'MistralEngine', useValue: {} },
        { provide: 'GeminiEngine', useValue: {} },
        { provide: 'PerplexityEngine', useValue: {} },
        { provide: 'GrokEngine', useValue: {} },
        { provide: 'DeepSeekEngine', useValue: {} },
        { provide: 'OpenRouterEngine', useValue: {} },
        // Mock ConfigService
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              // Provide mock values for any expected config keys
              if (key === 'OPENAI_API_KEY') return 'test_api_key';
              return null;
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    chatService = module.get<ChatService>(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should call chatService.sendMessage for non-streaming requests', async () => {
      const payload: SendMessageDto = {
        provider: 'openai',
        prompt: 'Hello',
      };
      const result = { content: 'Hi there' };
      mockChatService.sendMessage.mockResolvedValue(result);

      const res = {
        json: jest.fn(),
      } as unknown as Response;

      await controller.sendMessage(payload, res);

      expect(chatService.sendMessage).toHaveBeenCalledWith(payload);
      expect(res.json).toHaveBeenCalledWith(result);
    });

    it('should handle errors from chatService.sendMessage gracefully', async () => {
      const payload: SendMessageDto = {
        provider: 'openai',
        prompt: 'Hello',
      };
      const error = new Error('Service failed');
      mockChatService.sendMessage.mockRejectedValue(error);

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.sendMessage(payload, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'An error occurred while processing your request',
        details: error.message,
      });
    });

    it('should call chatService.sendMessageStream for streaming requests', async () => {
      const payload: SendMessageDto = {
        provider: 'openai',
        prompt: 'Hello',
        stream: true,
      };

      const stream = (async function* () {
        yield { content: 'Hello' };
        yield { content: ' there' };
        yield { done: true };
      })();
      mockChatService.sendMessageStream.mockReturnValue(stream);

      const res = {
        setHeader: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      } as unknown as Response;

      await controller.sendMessage(payload, res, 'text/event-stream');

      expect(chatService.sendMessageStream).toHaveBeenCalledWith(payload);
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/event-stream',
      );
      expect(res.write).toHaveBeenCalledTimes(3);
      expect(res.write).toHaveBeenNthCalledWith(1, 'data: {"content":"Hello"}\n\n');
      expect(res.write).toHaveBeenNthCalledWith(2, 'data: {"content":" there"}\n\n');
      expect(res.write).toHaveBeenNthCalledWith(3, 'data: [DONE]\n\n');
      expect(res.end).toHaveBeenCalled();
    });
  });

  describe('getOpenRouterModels', () => {
    it('should call chatService.getOpenRouterModels', async () => {
      const models = [{ id: 'gpt-4', name: 'GPT-4' }];
      mockChatService.getOpenRouterModels.mockResolvedValue(models);

      const result = await controller.getOpenRouterModels('some-api-key');

      expect(chatService.getOpenRouterModels).toHaveBeenCalledWith(
        'some-api-key',
      );
      expect(result).toEqual(models);
    });
  });

  describe('getAvailableProviders', () => {
    it('should call chatService.getAvailableProviders', async () => {
      const providers = [{ id: 'openai', name: 'OpenAI' }];
      mockChatService.getAvailableProviders.mockResolvedValue(providers);

      const result = await controller.getAiProviders();

      expect(chatService.getAvailableProviders).toHaveBeenCalled();
      expect(result).toEqual(providers);
    });
  });

  describe('getModelsForProviders', () => {
    it('should call chatService.getModelsForProviders with correct arguments', async () => {
      const models = { openai: [{ id: 'gpt-4', name: 'GPT-4' }] };
      mockChatService.getModelsForProviders.mockResolvedValue(models);

      const result = await controller.getModelsForProviders(
        'openai,openrouter',
        'some-api-key',
      );

      expect(chatService.getModelsForProviders).toHaveBeenCalledWith(
        ['openai', 'openrouter'],
        'some-api-key',
      );
      expect(result).toEqual(models);
    });
  });
});