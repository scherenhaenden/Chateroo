import { Test, TestingModule } from '@nestjs/testing';
import { LmStudioEngine } from './lm-studio.engine';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { ChatPayload } from './ai-api-engine.base';
import { AxiosResponse } from 'axios';
import { Readable } from 'stream';

const mockHttpService = {
  post: jest.fn(),
};

describe('LmStudioEngine', () => {
  let engine: LmStudioEngine;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LmStudioEngine,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    engine = module.get<LmStudioEngine>(LmStudioEngine);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  it('should have the provider name "lm-studio"', () => {
    expect(engine.provider).toEqual('lm-studio');
  });

  describe('sendMessage', () => {
    const payload: ChatPayload = { prompt: 'Hello, local model!' };

    it('should send a request to the LM Studio API and return content', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          choices: [{ message: { content: 'Hello from local model!' } }],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: undefined },
      };
      mockHttpService.post.mockReturnValue(of(mockResponse));

      const response = await engine.sendMessage(payload);

      expect(httpService.post).toHaveBeenCalledWith(
        'http://localhost:1234/v1/chat/completions',
        {
          model: 'local-model',
          messages: [{ role: 'user', content: payload.prompt }],
          temperature: 0.7,
        },
        { headers: { 'Content-Type': 'application/json' } },
      );
      expect(response).toEqual({ content: 'Hello from local model!' });
    });

    it('should handle connection errors gracefully', async () => {
      const error = new Error('Connection refused');
      mockHttpService.post.mockReturnValue(throwError(() => error));
      const response = await engine.sendMessage(payload);
      expect(response.content).toContain(
        'Fehler bei der Verbindung mit LM Studio.',
      );
    });
  });

  describe('sendMessageStream', () => {
    const payload: ChatPayload = { prompt: 'Stream hello' };

    it('should handle a stream correctly', async () => {
      const sseStream = new Readable();
      sseStream.push('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n');
      sseStream.push(
        'data: {"choices":[{"delta":{"content":" stream!"}}]}\n\n',
      );
      sseStream.push('data: [DONE]\n\n');
      sseStream.push(null);

      const mockResponse: AxiosResponse = {
        data: sseStream,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: undefined },
      };
      mockHttpService.post.mockReturnValue(of(mockResponse));

      const stream = engine.sendMessageStream(payload);
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual([
        { content: 'Hello' },
        { content: ' stream!' },
        { content: '', done: true },
      ]);
    });

    it('should handle stream connection errors', async () => {
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('Stream Error')),
      );
      const stream = engine.sendMessageStream(payload);
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      expect(chunks[0].content).toContain(
        'Sorry, there was an error communicating with LM Studio.',
      );
      expect(chunks[0].done).toBe(true);
    });
  });
});
