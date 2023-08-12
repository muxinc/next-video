import assert from 'node:assert';
import { describe, it } from 'node:test';

import videoHandler, { callHandler } from '../src/video-handler.js';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('videoHandler', () => {
  it('returns a curried function for the callback', async () => {
    const handler = videoHandler('test', async (event) => {
      return event;
    });

    assert((await handler('test')) === 'test');
  });

  it('adds the handler to be called via callHandler', async (ctx) => {
    ctx.mock.timers.enable(['setTimeout']);

    const randomNumber = Math.floor(Math.random() * 1000);
    videoHandler(`test_${randomNumber}`, (event) => {
      return event;
    });

    const result = await callHandler(`test_${randomNumber}`, 'oh hai');

    ctx.mock.timers.tick(9999);
    assert(result === 'oh hai');
  });
});

describe('callHandler', () => {
  it('should call the handler for the given event', async (ctx) => {
    ctx.mock.timers.enable(['setTimeout']);

    const randomNumber = Math.floor(Math.random() * 1000);
    videoHandler(`test_${randomNumber}`, (event) => {
      return event;
    });

    const result = await callHandler(`test_${randomNumber}`, 'oh hai');
    ctx.mock.timers.tick(9999);

    assert(result === 'oh hai');
  });

  it('should return undefined if no handler is registered', async () => {
    const result = await callHandler(`test_${Math.floor(Math.random() * 1000)}`, 'oh hai');
    assert(result === undefined);
  });

  it('should timeout if the handler takes too long', async (ctx) => {
    ctx.mock.timers.enable(['setTimeout']);

    const randomNumber = Math.floor(Math.random() * 1000);
    videoHandler(`test_${randomNumber}`, async (event) => {
      await sleep(20);
      return event;
    });

    ctx.mock.timers.tick(9999);
    assert.rejects(callHandler(`test_${randomNumber}`, 'oh hai', { timeout: 10 }));
  });
});
