import { Test, TestingModule } from '@nestjs/testing';
import { GeminiEngine } from './gemini.engine';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { ChatPayload } from './ai-api-engine.base';
import { AxiosResponse } from 'axios';
import { Readable } from 'stream';

const mockHttpService = {
  post: jest.fn(),
};

describe('GeminiEngine', () => {
  let engine: GeminiEngine;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiEngine,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    engine = module.get<GeminiEngine>(GeminiEngine);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  it('should have the provider name "gemini"', () => {
    expect(engine.provider).toEqual('gemini');
  });

  describe('sendMessage', () => {
    const payload: ChatPayload = {
      apiKey: 'test-api-key',
      prompt: 'Hello, world!',
    };

    it('should send a request and return content', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          choices: [{ message: { content: 'Hello from Gemini!' } }],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: undefined },
      };
      mockHttpService.post.mockReturnValue(of(mockResponse));

      const response = await engine.sendMessage(payload);

      expect(httpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          model: 'gemini-1.5-flash',
          messages: [{ role: 'user', content: payload.prompt }],
        }),
        expect.any(Object),
      );
      expect(response).toEqual({ content: 'Hello from Gemini!' });
    });

    it('should handle attachments correctly', async () => {
      const payloadWithAttachment: ChatPayload = {
        ...payload,
        attachments: [
          { name: 'test.txt', type: 'text/plain', size: 12, base64: Buffer.from('Hello file').toString('base64') }
        ],
      };

      mockHttpService.post.mockReturnValue(of({
        data: { choices: [{ message: { content: 'response' } }] }
      }));

      await engine.sendMessage(payloadWithAttachment);

      const expectedContent = `${payload.prompt}\n\nAngehängte Dateien:\n[DATEI: test.txt]\nHello file`;
      expect(httpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          messages: [{ role: 'user', content: expectedContent }],
        }),
        expect.any(Object)
      );
    });

    it('should handle API errors gracefully', async () => {
      mockHttpService.post.mockReturnValue(throwError(() => new Error('API Error')));
      const response = await engine.sendMessage(payload);
      expect(response).toEqual({
        content: 'Sorry, there was an error communicating with Gemini.',
      });
    });
  });

  describe('sendMessageStream', () => {
    const payload: ChatPayload = {
      apiKey: 'test-api-key',
      prompt: 'Stream hello',
    };

    it('should handle a stream correctly', async () => {
      const sseStream = new Readable();
      sseStream.push('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n');
      sseStream.push('data: {"choices":[{"delta":{"content":" Gemini!"}}]}\n\n');
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

      expect(httpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ stream: true }),
        expect.any(Object)
      );
      expect(chunks).toEqual([
        { content: 'Hello' },
        { content: ' Gemini!' },
        { content: '', done: true },
      ]);
    });

    it('should handle stream errors gracefully', async () => {
       mockHttpService.post.mockReturnValue(throwError(() => new Error('Stream Error')));

       const stream = engine.sendMessageStream(payload);
       const chunks = [];
       for await (const chunk of stream) {
         chunks.push(chunk);
       }

       expect(chunks).toEqual([{
         content: 'Sorry, there was an error communicating with Gemini.',
         done: true
       }]);
    });
  });
});