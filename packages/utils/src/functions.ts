import { AsyncCallTimeOut } from "./exceptions";
import * as dotenv from "dotenv"
import * as path from "path"
import * as fs from "fs"




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

function matchEnvFileInDirectory(_path: string): string[] {
    const envFileName = process.env.ENV_NAME || ".env";
    return fs.readdirSync(_path, { withFileTypes: true }).filter((item) => !item.isDirectory() && item.name === envFileName).map((item) => path.join(_path, item.name));
}

function _findEnvInDirectory(dirname: string): string {

    const stopLimit = parseInt(process.env.STOP_LIMIT) || 4;
    let currentNumber = 0

    function _innerFindEnvInDirectory(dirname): string {
        let matches: string[] = [];
        const _path = path.parse(dirname);
        matches = matchEnvFileInDirectory(_path.dir);
        if (matches.length === 0 && currentNumber < stopLimit) {
            currentNumber += 1;
            return _innerFindEnvInDirectory(_path.dir);
        }else if(currentNumber === stopLimit){
            return "";
        }
        return matches[0]
    }

    return _innerFindEnvInDirectory(dirname);
}


export function findEnv(dirname: string): string {
    const match =  _findEnvInDirectory(dirname);
    return match.length === 0? dirname : match;
}

export function configEnv(): dotenv.DotenvConfigOutput {
    const path = findEnv(__dirname);
    return dotenv.config({ path: path});
}


