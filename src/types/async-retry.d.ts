// types/async-retry.d.ts
declare module 'async-retry' {
  interface RetryOptions {
    retries?: number;
    factor?: number;
    minTimeout?: number;
    maxTimeout?: number;
    randomize?: boolean;
    onRetry?: (error: Error) => void;
  }

  function retry<T>(
    fn: (bail: (error: Error) => void) => Promise<T>,
    options?: RetryOptions
  ): Promise<T>;

  export = retry;
}