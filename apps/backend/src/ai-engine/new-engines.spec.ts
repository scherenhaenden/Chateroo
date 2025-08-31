import { of, throwError } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { MistralEngine } from './mistral.engine';
import { GeminiEngine } from './gemini.engine';
import { PerplexityEngine } from './perplexity.engine';
import { GrokEngine } from './grok.engine';
import { DeepseekEngine } from './deepseek.engine';
import { OpenRouterEngine } from './openrouter.engine';

describe.each([
  {
    name: 'Mistral',
    Engine: MistralEngine,
    url: 'https://api.mistral.ai/v1/chat/completions',
    model: 'mistral-large-latest',
  },
  {
    name: 'Gemini',
    Engine: GeminiEngine,
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: 'gemini-1.5-flash',
  },
  {
    name: 'Perplexity',
    Engine: PerplexityEngine,
    url: 'https://api.perplexity.ai/chat/completions',
    model: 'llama-3-sonar-large-32k-online',
  },
  {
    name: 'Grok',
    Engine: GrokEngine,
    url: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-1',
  },
  {
    name: 'Deepseek',
    Engine: DeepseekEngine,
    url: 'https://api.deepseek.com/chat/completions',
    model: 'deepseek-chat',
  },
  {
    name: 'OpenRouter',
    Engine: OpenRouterEngine,
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'openai/gpt-4o-mini',
  },
])('$nameEngine', ({ name, Engine, url, model }) => {
  let engine: InstanceType<typeof Engine>;
  let httpService: { post: jest.Mock };

  beforeEach(() => {
    httpService = { post: jest.fn() } as any;
    engine = new Engine(httpService as unknown as HttpService);
  });

  it('sends message with proper body and headers', async () => {
    const apiKey = 'test-key';
    const prompt = 'Hello there';
    const mockResponse = {
      data: { choices: [{ message: { content: 'Hi!' } }] },
    };
    httpService.post.mockReturnValue(of(mockResponse));

    const result = await engine.sendMessage({ prompt, apiKey });

    expect(result).toEqual({ content: 'Hi!' });
    expect(httpService.post).toHaveBeenCalledWith(
      url,
      { model, messages: [{ role: 'user', content: prompt }] },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );
  });

  it('returns friendly error message on failure', async () => {
    const apiKey = 'bad-key';
    const prompt = 'Hello there';
    httpService.post.mockReturnValue(throwError(() => new Error('boom')));

    const result = await engine.sendMessage({ prompt, apiKey });

    expect(result).toEqual({
      content: `Sorry, there was an error communicating with ${name}.`,
    });
  });
});
