export interface QueueItem<T = any> {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
}

export class Queue {  
  private lastRequestTime: number | null = null;
  private requestQueue: QueueItem[] = [];
  private processing = false;
  private delayMs: number;

  constructor(delayMs: number = 1000) {    
    this.delayMs = delayMs;
  }

  public async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.requestQueue.push({ fn, resolve, reject });

      if (!this.processing) {        
        this.processNext();
      }
    });
  }

  private processNext() {
    if (this.requestQueue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;

    if (this.lastRequestTime !== null) {
      const elapsed = Date.now() - this.lastRequestTime;
      const waitTime = this.delayMs - elapsed;

      if (waitTime > 0) {
        setTimeout(() => this.executeNextRequest(), waitTime);
      } else {
        this.executeNextRequest();
      }
    } else {
      this.executeNextRequest();
    }
  }

  private executeNextRequest() {
    const item = this.requestQueue.shift();

    if (!item) {
      this.processing = false;
      return;
    }

    const { fn, resolve, reject } = item;

    fn()
      .then((result) => {
        resolve(result);
      })
      .catch((err) => {
        reject(err);
      })
      .finally(() => {
        this.lastRequestTime = Date.now();
        this.processNext();
      });
  }
}
