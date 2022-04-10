import { UnsuitablePlatformException } from "./exceptions";
import { isWebPlatform } from "./functions";
import { BaseStorageInterface, BaseStorageOptions, NaiveStorage, StorageType } from "./types";




export class BaseWebStorage<T extends BaseStorageOptions = BaseStorageOptions> implements BaseStorageInterface {

    protected storage: NaiveStorage | Record<string, any>;
    readonly type: StorageType;

    /**
    * @callback onConnectCallback will be called after the connection is established
    * @defaultValue empty function
    * 
    * @callback beforeDisconnectCallback will be called just before the connection is established
    * @defaultValue empty function
    */
    protected onConnectCallback: (self: ThisType<BaseStorageInterface>) => Promise<void>;
    protected beforeDisconnectCallback: (self: ThisType<BaseStorageInterface>) => Promise<void>;

    /**
     * Set default values for the class properties
     */
    setDefaultArguments(): void {
        this.onConnectCallback = async (self: ThisType<typeof this>) => { ; };
        this.beforeDisconnectCallback = async (self: ThisType<typeof this>) => { ; };

    }

    constructor(options?: T) {
        this.setDefaultArguments();
        if (options !== undefined) {
            if (options.onConnectCallback !== undefined) {
                this.onConnectCallback = options.onConnectCallback;
            }
            if (options.beforeDisconnectCallback !== undefined) {
                this.beforeDisconnectCallback = options.beforeDisconnectCallback;
            }
        }
    }

    isStorageDefined(): boolean {
        return this.storage !== null && this.storage !== undefined
    }

    isType(type: StorageType): boolean {
        return this.type === type;
    }


    connect(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async isConnected(): Promise<boolean> {
        if (this.isStorageDefined()) {
            const pingValue = '__test__ping__';
            const pingKey = '__ping__'
            await this.setItem(pingKey, pingValue);
            return (await this.getItem<string>(pingKey)) === pingValue;

        }
        return false;
    }

    /**
     * 
     * @param value 
     * @returns Serialized version of the provided value
     */
    serialize(value: any) {
        return JSON.stringify(value);
    }

    /**
     * 
     * @param value 
     * @returns Deserialize stored data to desired object
     */
    deserialize<T>(value: any): T {
        return JSON.parse(value) as T;
    }

    async setItem(key: string, value: any): Promise<void> {
        this.storage.setItem(key, this.serialize(value));
    }
    async getItem<T = any>(key: string): Promise<T | null> {
        const value = this.storage.getItem(key);
        if (value === null || value === undefined) return null;
        return this.deserialize<T>(value);
    }
    
    /**
     * 
     * @param key 
     * @returns boolean indicating 
     */
    async hasKey(key: string): Promise<boolean>{
        return (await this.getItem<any>(key)) !== null;
    }
    async removeItem(key: string): Promise<void> {
        this.storage.removeItem(key);
    }

    async clear(): Promise<void> {
        this.storage.clear();
    }
    async disconnect(): Promise<void> {
        const self = this;
        await this.beforeDisconnectCallback(self);
        await this.clear();
        this.storage = null;
    }

    /**
     * 
     * Check if the window is in global variable and defined
     * otherwise @throws UnsuitablePlatformException because
     * the class only supports Web platform
     * 
     * @param name Name of the class instance
     */
    checkPlatform(name: string = "WebStorage"): void {
        if (window === undefined || window === null || ! isWebPlatform()) {
            throw new UnsuitablePlatformException(`${name} only supports web platform`)
        }
    }
}


export class WebLocalStorage extends BaseWebStorage<BaseStorageOptions> {

    readonly type = StorageType.Local;

    /**
     * @override
     * 
     * After the verification of platform, which must be web
     * store window.localStorage instance in @property storage
     * Call onConnectCallback after connection
     */
    async connect(): Promise<void> {
        this.checkPlatform('WebLocalStorage');
        this.storage = window.localStorage;
        this.onConnectCallback(this);
    }

}



export class WebSessionStorage extends BaseWebStorage {

    readonly type = StorageType.Session;

    /**
     * @override
     * 
     * After the verification of platform, which must be web
     * store window.sessionStorage instance in @property storage
     * Call onConnectCallback after connection
     */
    async connect(): Promise<void> {
        this.checkPlatform('WebSessionStorage');
        this.storage = window.sessionStorage;
        this.onConnectCallback(this);
    }
}


/**
 * In-Memory data store which stores data in Window
 * All the object stored in the storage won't be serialized to string
 * instead will be stored directly
 * 
 * The constructor will be able to read/write data across different pages of the site
 * 
 */
export class WebWindowStore extends BaseWebStorage {
    readonly type = StorageType.Memory;

    private keyName = '_webWindowStoreAlmight'

    /**
     * @override
     * 
     * After the verification of platform, which must be web
     * store window.sessionStorage instance in @property storage
     * Call onConnectCallback after connection
     */
    async connect(): Promise<void> {
        this.checkPlatform('WebSessionStorage');
        if ((window as any)[this.keyName] === undefined) {
            (window as any)[this.keyName] = {};
        }
        this.storage = (window as any)._webWindowStoreAlmight
        this.onConnectCallback(this);
    }


    async isConnected(): Promise<boolean> {
        return (this.storage !== null && (window as any)[this.keyName] !== undefined);
    }

    serialize(value: any): any {
        return value;
    }

    deserialize<T>(value: any): T {
        return value as T;
    }

    /**
     * @override 
     * 
     * Remove the keyName property from window
     */
    async clear(): Promise<void> {
        (window as any)[this.keyName] = {};
    }


    async setItem(key: string, value: any): Promise<void> {
        this.storage[key] = this.serialize(value);
    }

    async getItem<T = any>(key: string): Promise<T> {
        return this.deserialize<T>(this.storage[key]);
    }

    async removeItem(key: string): Promise<void> {
        delete this.storage[key];
    }

}