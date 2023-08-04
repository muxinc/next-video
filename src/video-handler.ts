interface Handlers {
  [key: string]: ((event: any) => Promise<any>)[];
}

export const HANDLERS: Handlers = {};

export function callHandlers(event: string, data: any): Promise<any[]> {
  const handlers = HANDLERS[event] || [];

  return Promise.all(
    handlers.map((handler) => {
      return handler(data);
    })
  );
}

// This won't really work for our usecases long term, but it's a start.
// We need to be able to pass in a callback that will override the default, and this will do both.
// We could move to requiring a callback array, but that would kinda stink in that we couldn't return the callback
// immediately as a curried function.
type VideoHandlerCallback = (event: any) => Promise<any> | any;
export default function videoHandler(event: string, callback: VideoHandlerCallback) {
  const currentHandlers = HANDLERS[event] || [];

  HANDLERS[event] = [...currentHandlers, callback];

  return async (event: any) => callback(event);
}
