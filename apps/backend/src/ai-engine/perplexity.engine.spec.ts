import { Test, TestingModule } from '@nestjs/testing';
import { PerplexityEngine } from './perplexity.engine';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { ChatPayload } from './ai-api-engine.base';
import { AxiosResponse } from 'axios';

const mockHttpService = {
  post: jest.fn(),
};

describe('PerplexityEngine', () => {
  let engine: PerplexityEngine;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerplexityEngine,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    engine = module.get<PerplexityEngine>(PerplexityEngine);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  it('should have the provider name "perplexity"', () => {
    expect(engine.provider).toEqual('perplexity');
  });

  describe('sendMessage', () => {
    const payload: ChatPayload = {
      apiKey: 'test-api-key',
      prompt: 'What is the capital of France?',
    };

    it('should send a request to the Perplexity API and return the content', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          choices: [
            { message: { content: 'The capital of France is Paris.' } },
          ],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: undefined },
      };
      mockHttpService.post.mockReturnValue(of(mockResponse));

      const response = await engine.sendMessage(payload);

      expect(httpService.post).toHaveBeenCalledWith(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'llama-3-sonar-large-32k-online',
          messages: [{ role: 'user', content: payload.prompt }],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.apiKey}`,
          },
        },
      );
      expect(response).toEqual({ content: 'The capital of France is Paris.' });
    });

    it('should handle API errors gracefully', async () => {
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('API Error')),
      );
      const response = await engine.sendMessage(payload);
      expect(response).toEqual({
        content: 'Sorry, there was an error communicating with Perplexity.',
      });
    });

    it('should handle invalid response format', async () => {
      const invalidResponse: AxiosResponse = {
        data: { choices: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: undefined },
      };
      mockHttpService.post.mockReturnValue(of(invalidResponse));
      const response = await engine.sendMessage(payload);
      expect(response).toEqual({
        content: 'Sorry, there was an error communicating with Perplexity.',
      });
    });
  });
});
