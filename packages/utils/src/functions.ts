import { AsyncCallTimeOut } from "./exceptions";
import {findUpSync} from "find-up"
import * as dotenv from "dotenv"



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


export function findEnv(): string {
    return findUpSync(process.env.ENV_FILE || '.env')
}

export function configEnv(): void {
    const path = findEnv();
    dotenv.config({path: path})
}


