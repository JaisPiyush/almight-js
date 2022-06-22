import { AsyncCallTimeOut } from "./exceptions";





/**
 * Returns value indicating the platform running the code is a web browser
 * @returns the  platform is web browser
 */
export function isWebPlatform(): boolean {
    return globalThis !== undefined && globalThis.document !== undefined;
}
/**
 * Call an async function with a maximum time limit (in milliseconds)
 * @param {Promise<any>} asyncPromise An asynchronous promise to resolve
 * @param {number} timeout 
 * @returns {Promise<any> | undefined} Resolved promise for async function call,
 * or an error for the exhanusted time limit
 */
export async function asyncCallWithTimeBound(asyncPromise: Promise<any>, timeout: number): Promise<any> | undefined {

    let timeoutHandler;

    const timeoutPromise = new Promise((resolve, reject) => {
        timeoutHandler = setTimeout(() => {
            reject(new AsyncCallTimeOut())
        }, timeout);
    });

    return Promise.race([asyncPromise, timeoutPromise]).then((result) => {
        clearTimeout(timeoutHandler);
        return result;
    });

}

export function isMobileWebPlatform(): boolean {
    const toMatch = [
        /Android/i,
        /webOS/i,
        /iPhone/i,
        /iPad/i,
        /iPod/i,
        /BlackBerry/i,
        /Windows Phone/i
    ];
    
    return toMatch.some((toMatchItem) => {
        return navigator.userAgent.match(toMatchItem);
    });
}


export function isIOSMobileBrowserPlatform(): boolean {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isAndroidMobileBrowserPlatform(): boolean {
    return /Android/i.test(navigator.userAgent);
}