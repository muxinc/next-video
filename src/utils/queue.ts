export interface QueueItem<T = any> {
    fn: () => Promise<T>;
    resolve: (value: T) => void;
    reject: (reason?: any) => void;
}

export class Queue {
    private intervalId: NodeJS.Timeout | undefined = undefined;
    private firstItemInQueue: boolean = true;
    private requestQueue: QueueItem[] = [];
    private processingInterval: number;

    constructor(processingInterval: number = 1000) {
        this.processingInterval = processingInterval;
    }

    public async startProcessingQueue(): Promise<void> {
        if (this.intervalId) {
            return;
        }
        this.intervalId = setInterval(async () => {
            if (this.requestQueue.length > 0) {
                const { fn, resolve, reject } = this.requestQueue.shift() as QueueItem;
                try {
                    const result = await fn();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            } else {
                this.firstItemInQueue = true;
            }
        }, this.processingInterval);
    }

    public stopProcessingQueue(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
            this.firstItemInQueue = true;
        }
    }

    public async enqueueMethod<T>(fn: () => Promise<T>): Promise<T> {
        if (this.firstItemInQueue) {
            this.firstItemInQueue = false;
            return await fn();
        } else {
            return new Promise<T>((resolve, reject) => {
                this.requestQueue.push({ fn, resolve, reject });
            });
        }
    }
}
