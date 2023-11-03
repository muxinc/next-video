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

  let timeoutId: NodeJS.Timeout;
  const timeout = new Promise(
    (_, reject) => (timeoutId = setTimeout(() => reject({ error: `Timed out after ${ms} ms.` }), ms))
  );

  promise.then(() => clearTimeout(timeoutId));
  const value = await Promise.race([promise, timeout]);

  return value;
};

// Not doing anything in the config right now.
const DEFAULT_HANDLER_CONFIG = {
  provider: 'mux',
};

export async function callHandler(event: string, data: any, config: HandlerConfig = {}): Promise<any> {
  const mergedConfig = { ...DEFAULT_HANDLER_CONFIG, ...config };
  const handler = HANDLERS[event];

  if (!handler) {
    return;
  }

  // Always wrap the handler result in a Promise.resolve so we're always dealing with a promise.
  return Promise.resolve(handler(data, mergedConfig));
}

export default function videoHandler(event: string, callback: VideoHandlerCallback) {
  HANDLERS[event] = callback;

  return (event: any) => Promise.resolve(callback(event));
}
