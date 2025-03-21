export interface QueueItem<T = any> {
    fn: () => Promise<T>;
    resolve: (value: T) => void;
    reject: (reason?: any) => void;
}

let intervalId: NodeJS.Timeout | undefined = undefined;
let firstItemInQueue: boolean = true;
const requestQueue: QueueItem[] = [];

export async function startProcessingQueue() {
    if (intervalId) {
        return;
    }
    intervalId = setInterval(async () => {
        if (requestQueue.length > 0) {
            const { fn, resolve, reject } = requestQueue.shift() as QueueItem;
            try {
                const result = await fn();
                resolve(result);
            } catch (error) {
                reject(error);
            }
        }
    }, 1000);
}

export function stopProcessingQueue() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = undefined;
  }
}

export async function enqueueMethod<T>(fn: () => Promise<T>): Promise<T> {
    if (firstItemInQueue) {
        firstItemInQueue = false;
        return await fn();
    } else {
        return new Promise<T>((resolve, reject) => {
            requestQueue.push({ fn, resolve, reject });
        });
    }
}
