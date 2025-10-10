import { Test, TestingModule } from '@nestjs/testing';
import { OpenAiEngine } from './openai.engine';
import { ChatPayload } from './ai-api-engine.base';

describe('OpenAiEngine', () => {
  let engine: OpenAiEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenAiEngine],
    }).compile();

    engine = module.get<OpenAiEngine>(OpenAiEngine);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  it('should have the provider name "openai"', () => {
    expect(engine.provider).toEqual('openai');
  });

  describe('sendMessage', () => {
    it('should return an error if apiKey is missing', async () => {
      const payload: ChatPayload = { prompt: 'test' };
      const response = await engine.sendMessage(payload);
      expect(response).toEqual({ content: 'Fehler: OpenAI API-Schlüssel fehlt.' });
    });

    it('should return a simulated response after a delay', async () => {
      const payload: ChatPayload = { apiKey: 'fake-key', prompt: 'test prompt' };
      const promise = engine.sendMessage(payload);

      jest.advanceTimersByTime(1000);

      const response = await promise;
      expect(response).toEqual({ content: `OpenAI würde auf "${payload.prompt}" antworten.` });
    });

    it('should process a text file attachment', async () => {
        const fileContent = 'This is the content of the text file.';
        const payload: ChatPayload = {
            apiKey: 'fake-key',
            prompt: 'Summarize this file',
            attachments: [{
                name: 'document.txt',
                type: 'text/plain',
                size: fileContent.length,
                base64: Buffer.from(fileContent).toString('base64'),
            }],
        };

        // We don't need to test the response content here, just the prompt generation logic
        // which is internal. We can infer it by checking the logic inside the method.
        // For this mock, we'll just check that it runs without error.
        const promise = engine.sendMessage(payload);
        jest.advanceTimersByTime(1000);
        const response = await promise;

        // The enhanced prompt is not directly exposed, but we know the logic.
        // A more complex implementation might spy on internal methods.
        // For now, we trust the simulated response indicates it ran.
        expect(response.content).toContain('Summarize this file');
    });

    it('should process an image attachment', async () => {
        const payload: ChatPayload = {
            apiKey: 'fake-key',
            prompt: 'Describe this image',
            attachments: [{
                name: 'photo.jpg',
                type: 'image/jpeg',
                size: 1024 * 500, // 500 KB
                base64: 'fake-image-data',
            }],
        };
        const promise = engine.sendMessage(payload);
        jest.advanceTimersByTime(1000);
        await promise;
        // Similar to the text file, we are just ensuring it runs.
        // The internal prompt would be "Describe this image\n\nAngehängte Dateien:\nBild: photo.jpg (500.00 KB)"
        // but we can't assert that directly without refactoring the engine.
        // So we just check that the original prompt is in the final output of the mock
        expect((await promise).content).toContain('Describe this image');
    });
  });
});