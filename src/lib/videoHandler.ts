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

export default function videoHandler(event: string, callback: (event: any) => Promise<any> | any) {
	const currentHandlers = HANDLERS[event] || [];

	HANDLERS[event] = [...currentHandlers, callback];

	return async (event: any) => callback(event);
}
