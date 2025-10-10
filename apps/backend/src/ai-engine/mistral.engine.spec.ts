import { Test, TestingModule } from '@nestjs/testing';
import { MistralEngine } from './mistral.engine';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { ChatPayload } from './ai-api-engine.base';
import { AxiosResponse } from 'axios';

const mockHttpService = {
  post: jest.fn(),
};

describe('MistralEngine', () => {
  let engine: MistralEngine;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MistralEngine,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    engine = module.get<MistralEngine>(MistralEngine);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  it('should have the provider name "mistral"', () => {
    expect(engine.provider).toEqual('mistral');
  });

  describe('sendMessage', () => {
    const payload: ChatPayload = {
      apiKey: 'test-api-key',
      prompt: 'Explain the importance of AI',
    };

    it('should send a request to the Mistral API and return the content', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          choices: [{ message: { content: 'AI is very important.' } }],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: undefined },
      };
      mockHttpService.post.mockReturnValue(of(mockResponse));

      const response = await engine.sendMessage(payload);

      expect(httpService.post).toHaveBeenCalledWith(
        'https://api.mistral.ai/v1/chat/completions',
        {
          model: 'mistral-large-latest',
          messages: [{ role: 'user', content: payload.prompt }],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.apiKey}`,
          },
        },
      );
      expect(response).toEqual({ content: 'AI is very important.' });
    });

    it('should handle API errors gracefully', async () => {
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('API Error')),
      );
      const response = await engine.sendMessage(payload);
      expect(response).toEqual({
        content: 'Sorry, there was an error communicating with Mistral.',
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
        content: 'Sorry, there was an error communicating with Mistral.',
      });
    });
  });
});
