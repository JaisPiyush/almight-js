export * from "./storage";
export * from "./functions";

export class TimeBoundPromise<T> extends Promise<T> {
    constructor(timeout, callback, time_out_error?: Error) {
        // We need to support being called with . milliseconds
        // value, because the various Promise methods (`then` and
        // such) correctly call the subclass constructor when
        // building the new promises they return.
        const haveTimeout = typeof timeout === "number";
        const init = haveTimeout ? callback : timeout;
        super((resolve, reject) => {
            if (haveTimeout) {
                const timer = setTimeout(() => {
                    const error = time_out_error !== undefined ? time_out_error:  new Error(`Promise timed out after ${timeout}ms`);
                    reject(error);
                }, timeout);
                init(
                    (value) => {
                        clearTimeout(timer);
                        resolve(value);
                    },
                    (error) => {
                        clearTimeout(timer);
                        reject(error);
                    }
                );
            } else {
                init(resolve, reject);
            }
        });
    }
    
    // Timebounding already existing promises
    static resolveWithTimeout(timeout, promise, time_out_error?: Error) {
        if (!promise || typeof promise.then !== "function") {
            // `promise` isn't a thenable, no need for the timeout,
            // fulfill immediately
            return this.resolve(promise);
        }
        return new this(timeout, promise.then.bind(promise), time_out_error);
    }
}