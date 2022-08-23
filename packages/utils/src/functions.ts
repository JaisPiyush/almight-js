import {  ChainsManager } from "./constants";
import { Chainset, CHAINSET_RECORD } from "./chains"
import { DefaultChainManager, IMetaDataSet, META_DATA_SET, Providers } from "./constants";
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

    if(globalThis.navigator === undefined) return false
    
    return toMatch.some((toMatchItem) => {
        return globalThis.navigator.userAgent.match(toMatchItem);
    });
}


export function isIOSMobileBrowserPlatform(): boolean {
    if(globalThis.navigator === undefined) return false
    return /iPhone|iPad|iPod/i.test(globalThis.navigator.userAgent);
}

export function isAndroidMobileBrowserPlatform(): boolean {
    if(globalThis.navigator === undefined) return false
    return /Android/i.test(globalThis.navigator.userAgent);
}

export function getMetaDataSet(): Record<Providers | string, IMetaDataSet> {
    if(globalThis.META_DATA_SET !== undefined) return globalThis.META_DATA_SET;
    return META_DATA_SET;
}


export function getChainSetRecord(): Record<string, Chainset> {
    if(globalThis.CHAINSET_RECORD !== undefined) return globalThis.CHAINSET_RECORD;
    return CHAINSET_RECORD;
}


export function getChainManager(): ChainsManager {
    if(globalThis.chainManager !== undefined) return globalThis.chainManager;
    return DefaultChainManager;
}


export function sortRecord<T = Record<string, any>>(s: T): T {
    const newS = {} as T;
    const keys = Object.keys(s).sort();
    for(const key of keys){
        if(s[key] !== undefined && typeof s[key] === "object"){
            newS[key] = sortRecord(s[key])
        }else{
            newS[key] = s[key]
        }
    }
    return newS;
}


export function compareTwoRecords(r1: Record<string, any>, r2: Record<string, any>): boolean{
    return JSON.stringify(sortRecord<Record<string,any>>(r1)) === JSON.stringify(sortRecord<Record<string,any>>(r2));
}