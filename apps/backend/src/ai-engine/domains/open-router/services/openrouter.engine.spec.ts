import { Test, TestingModule } from '@nestjs/testing';
import { OpenRouterEngine } from './openrouter.engine';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { ChatPayload } from '../../../ai-api-engine.base';
import { AxiosError, AxiosResponse } from 'axios';

const mockHttpService = {
  get: jest.fn(),
  post: jest.fn(),
};

describe('OpenRouterEngine', () => {
  let engine: OpenRouterEngine;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenRouterEngine,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    engine = module.get<OpenRouterEngine>(OpenRouterEngine);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  it('should have the provider name "openrouter"', () => {
    expect(engine.provider).toEqual('openrouter');
  });

  describe('listModels', () => {
    it('should fetch models from the OpenRouter API', async () => {
      const mockModels = { data: [{ id: 'model-1' }] };
      const mockResponse: AxiosResponse = {
        data: mockModels,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: undefined },
      };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const models = await engine.listModels('test-key');
      expect(httpService.get).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/models',
        expect.any(Object),
      );
      expect(models).toEqual([{ id: 'model-1' }]);
    });

    it('should return an empty array on API error', async () => {
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('API Error')),
      );
      const models = await engine.listModels('test-key');
      expect(models).toEqual([]);
    });
  });

  describe('listProviders', () => {
    it('should fetch providers from the OpenRouter API', async () => {
      const mockProviders = { data: [{ id: 'provider-1' }] };
      const mockResponse: AxiosResponse = {
        data: mockProviders,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: undefined },
      };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const providers = await engine.listProviders();
      expect(httpService.get).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/providers',
        expect.any(Object),
      );
      expect(providers).toEqual([{ id: 'provider-1' }]);
    });
  });

  describe('sendMessage', () => {
    const payload: ChatPayload = { apiKey: 'test-key', prompt: 'Hello' };

    it('should send a message and return content', async () => {
      const mockChatResponse = {
        data: { choices: [{ message: { content: 'Hi there!' } }] },
      };
      mockHttpService.post.mockReturnValue(of(mockChatResponse));

      const response = await engine.sendMessage(payload);
      expect(httpService.post).toHaveBeenCalled();
      expect(response.content).toEqual('Hi there!');
    });

    it('should handle 401 Unauthorized error', async () => {
      const error = new AxiosError('Unauthorized');
      error.response = {
        data: { error: { code: 401, message: 'Invalid API key' } },
        status: 401,
      } as AxiosResponse;
      mockHttpService.post.mockReturnValue(throwError(() => error));

      const response = await engine.sendMessage(payload);
      expect(response.content).toContain('Invalid API key');
    });

    it('should handle 429 Rate Limit error', async () => {
      const error = new AxiosError('Rate limit exceeded');
      error.response = {
        data: { error: { code: 429 } },
        status: 429,
      } as AxiosResponse;
      mockHttpService.post.mockReturnValue(throwError(() => error));

      const response = await engine.sendMessage(payload);
      expect(response.content).toContain('Rate limit exceeded');
    });

    it('should handle a generic error', async () => {
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('Some other error')),
      );
      const response = await engine.sendMessage(payload);
      expect(response.content).toContain(
        'Sorry, there was an error communicating with OpenRouter',
      );
    });
  });
});
