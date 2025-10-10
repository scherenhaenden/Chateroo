import { Test, TestingModule } from '@nestjs/testing';
import { GrokEngine } from './grok.engine';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { ChatPayload } from './ai-api-engine.base';
import { AxiosResponse } from 'axios';

const mockHttpService = {
  post: jest.fn(),
};

describe('GrokEngine', () => {
  let engine: GrokEngine;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GrokEngine,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    engine = module.get<GrokEngine>(GrokEngine);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  it('should have the provider name "grok"', () => {
    expect(engine.provider).toEqual('grok');
  });

  describe('sendMessage', () => {
    const payload: ChatPayload = {
      apiKey: 'test-api-key',
      prompt: 'Tell me a joke',
    };

    it('should send a request to the Grok API and return the content', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          choices: [{ message: { content: 'Why did the chicken cross the road?' } }],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: undefined },
      };
      mockHttpService.post.mockReturnValue(of(mockResponse));

      const response = await engine.sendMessage(payload);

      expect(httpService.post).toHaveBeenCalledWith(
        'https://api.x.ai/v1/chat/completions',
        {
          model: 'grok-1',
          messages: [{ role: 'user', content: payload.prompt }],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.apiKey}`,
          },
        },
      );
      expect(response).toEqual({ content: 'Why did the chicken cross the road?' });
    });

    it('should handle API errors gracefully', async () => {
      mockHttpService.post.mockReturnValue(throwError(() => new Error('API Error')));
      const response = await engine.sendMessage(payload);
      expect(response).toEqual({
        content: 'Sorry, there was an error communicating with Grok.',
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
        content: 'Sorry, there was an error communicating with Grok.',
      });
    });
  });
});