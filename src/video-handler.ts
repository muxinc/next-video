type VideoHandlerCallback = (event: any, ...args: any[]) => Promise<any>;

interface Handlers {
  [key: string]: VideoHandlerCallback;
}

export interface HandlerConfig {
  timeout?: number;
  [key: string]: any;
}

export const HANDLERS: Handlers = {};

const DEFAULT_HANDLER_CONFIG = {
  provider: 'mux',
};

export async function callHandler(event: string, data: any, config: HandlerConfig = {}): Promise<any> {
  const mergedConfig = { ...DEFAULT_HANDLER_CONFIG, ...config };
  const handler = HANDLERS[event];

  if (!handler) {
    return;
  }
  // Return values in an async function are automatically wrapped in a Promise.
  return handler(data, mergedConfig);
}

export function videoHandler(event: string, callback: VideoHandlerCallback) {
  HANDLERS[event] = callback;
  // Return values in an async function are automatically wrapped in a Promise.
  return async (event: any) => callback(event);
}
