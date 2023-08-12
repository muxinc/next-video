export const DEFAULT_TIMEOUT = 10000;

type VideoHandlerCallback = (event: any, ...args: any[]) => Promise<any>;

interface Handlers {
  [key: string]: VideoHandlerCallback;
}

export interface HandlerConfig {
  timeout?: number;
  [key: string]: any;
}

export const HANDLERS: Handlers = {};

const sleep = (ms: number) => new Promise((_, reject) => setTimeout(reject, ms));

const withTimeout = async (ms: number, promise: Promise<any>): Promise<any> => {
  if (!ms) {
    return promise;
  }

  const timeout = new Promise((_, reject) => setTimeout(() => reject({ error: `Timed out after ${ms} ms.` }), ms));
  const value = await Promise.race([promise, timeout]);

  return value;
};

const DEFAULT_HANDLER_CONFIG = {
  timeout: DEFAULT_TIMEOUT,
};
export async function callHandler(event: string, data: any, config: HandlerConfig = {}): Promise<any> {
  const mergedConfig = { ...DEFAULT_HANDLER_CONFIG, ...config };
  const handler = HANDLERS[event];

  if (!handler) {
    return;
  }

  // Always wrap the handler result in a Promise.resolve so we're always dealing with a promise.
  const handlerResult = handler(data, config);
  return withTimeout(mergedConfig.timeout || DEFAULT_TIMEOUT, Promise.resolve(handlerResult));
}

export default function videoHandler(event: string, callback: VideoHandlerCallback) {
  HANDLERS[event] = callback;

  return (event: any) => Promise.resolve(callback(event));
}
