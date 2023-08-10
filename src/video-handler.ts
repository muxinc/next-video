type VideoHandlerCallback = (event: any, ...args: any[]) => Promise<any>;

interface Handlers {
  [key: string]: VideoHandlerCallback[];
}

export const HANDLERS: Handlers = {};

export function callHandlers(event: string, data: any, ...args: any[]): Promise<any[]> {
  const handlers = HANDLERS[event] || [];

  return Promise.all(
    handlers.map((handler) => {
      return handler(data, args);
    })
  );
}

export default function videoHandler(event: string, callback: VideoHandlerCallback) {
  const currentHandlers = HANDLERS[event] || [];

  HANDLERS[event] = [...currentHandlers, callback];

  return async (event: any, ...args: any[]) => callback(event, args);
}
