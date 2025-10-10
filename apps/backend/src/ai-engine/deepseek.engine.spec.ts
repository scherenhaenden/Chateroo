import { Test, TestingModule } from '@nestjs/testing';
import { DeepseekEngine } from './deepseek.engine';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { ChatPayload } from './ai-api-engine.base';
import { AxiosResponse } from 'axios';

const mockHttpService = {
  post: jest.fn(),
};

describe('DeepseekEngine', () => {
  let engine: DeepseekEngine;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeepseekEngine,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    engine = module.get<DeepseekEngine>(DeepseekEngine);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  it('should have the provider name "deepseek"', () => {
    expect(engine.provider).toEqual('deepseek');
  });

  describe('sendMessage', () => {
    const payload: ChatPayload = {
      apiKey: 'test-api-key',
      prompt: 'Hello, world!',
    };

    it('should send a request to the Deepseek API and return the content', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          choices: [{ message: { content: 'Hello from Deepseek!' } }],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: undefined,
        },
      };
      mockHttpService.post.mockReturnValue(of(mockResponse));

      const response = await engine.sendMessage(payload);

      expect(httpService.post).toHaveBeenCalledWith(
        'https://api.deepseek.com/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: payload.prompt }],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.apiKey}`,
          },
        },
      );
      expect(response).toEqual({ content: 'Hello from Deepseek!' });
    });

    it('should handle API errors gracefully', async () => {
      const errorResponse = {
        response: { data: 'Internal Server Error' },
      };
      mockHttpService.post.mockReturnValue(throwError(() => errorResponse));

      const response = await engine.sendMessage(payload);

      expect(response).toEqual({
        content: 'Sorry, there was an error communicating with Deepseek.',
      });
    });

    it('should throw an error if the response format is invalid', async () => {
      const invalidResponse: AxiosResponse = {
        data: { choices: [] }, // Missing content
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: undefined,
        },
      };
      mockHttpService.post.mockReturnValue(of(invalidResponse));

      const response = await engine.sendMessage(payload);

      expect(response).toEqual({
        content: 'Sorry, there was an error communicating with Deepseek.',
      });
    });
  });
});
