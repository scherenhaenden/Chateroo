import { Test, TestingModule } from '@nestjs/testing';
import { DummyEngine } from './dummy.engine';
import { ChatPayload } from './ai-api-engine.base';

describe('DummyEngine', () => {
  let engine: DummyEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DummyEngine],
    }).compile();

    engine = module.get<DummyEngine>(DummyEngine);
    // Use fake timers to control setTimeout
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  it('should have the provider name "dummy"', () => {
    expect(engine.provider).toEqual('dummy');
  });

  describe('sendMessage', () => {
    it('should return a dummy response after a delay', async () => {
      const payload: ChatPayload = { prompt: 'test prompt' };
      const promise = engine.sendMessage(payload);

      // Fast-forward time by 1000ms
      jest.advanceTimersByTime(1000);

      const response = await promise;

      expect(response).toEqual({
        content: `Antwort vom Dummy-Provider für die Frage: "${payload.prompt}"`,
      });
    });
  });
});