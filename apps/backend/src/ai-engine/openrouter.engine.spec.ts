import { of } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { OpenRouterEngine } from './openrouter.engine';

describe('OpenRouterEngine', () => {
  let engine: OpenRouterEngine;
  let httpService: { get: jest.Mock; post: jest.Mock };

  beforeEach(() => {
    httpService = { get: jest.fn(), post: jest.fn() } as any;
    engine = new OpenRouterEngine(httpService as unknown as HttpService);
  });

  it('retrieves model list', async () => {
    const apiKey = 'test-key';
    const mockResponse = { data: { data: [{ id: 'model-1' }] } };
    httpService.get.mockReturnValue(of(mockResponse));

    const result = await engine.listModels(apiKey);

    expect(result).toEqual([{ id: 'model-1' }]);
    expect(httpService.get).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/models',
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );
  });

  it('uses provided model when sending message', async () => {
    const apiKey = 'test-key';
    const prompt = 'Ping';
    const model = 'custom-model';
    const mockResponse = { data: { choices: [{ message: { content: 'Pong' } }] } };
    httpService.post.mockReturnValue(of(mockResponse));

    const result = await engine.sendMessage({ prompt, apiKey, model });

    expect(result).toEqual({ content: 'Pong' });
    expect(httpService.post).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      { model, messages: [{ role: 'user', content: prompt }] },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );
  });
});
