import { UnsuitablePlatformException } from "./exceptions";
import { isWebPlatform } from "./functions";
import { BaseStorageInterface, BaseStorageOptions, NaiveStorage, StorageType } from "./types";




export class BaseWebStorage implements BaseStorageInterface {

    protected storage: NaiveStorage;
    readonly type: StorageType;
    public prefix?: string;

    /**
    * @callback onConnectCallback will be called after the connection is established
    * @defaultValue empty function
    * 
    * @callback beforeDisconnectCallback will be called just before the connection is established
    * @defaultValue empty function
    */
    protected onConnectCallback: (self: ThisType<BaseStorageInterface>) => void;
    protected beforeDisconnectCallback: (self: ThisType<BaseStorageInterface>) => void;

    /**
     * Set default values for the class properties
     */
    setDefaultArguments(): void {

        type selfType = ThisType<typeof this>;

        const empty_function = async function (self: selfType) {};
        this.onConnectCallback = empty_function;
        this.beforeDisconnectCallback = empty_function;

    }

    constructor(options?: BaseStorageOptions<BaseStorageInterface>) {
        this.setDefaultArguments();
        if (options !== undefined) {
            if (options.onConnectCallback !== undefined) {
                this.onConnectCallback = options.onConnectCallback;
            }
            if (options.beforeDisconnectCallback !== undefined) {
                this.beforeDisconnectCallback = options.beforeDisconnectCallback;
            }
        }

        if(isWebPlatform()){
            this.connect().then();
        }
    }

    isStorageDefined(): boolean {
        return this.storage !== null && this.storage !== undefined
    }

    isType(type: StorageType): boolean {
        return this.type === type;
    }


    async connect(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async isConnected(): Promise<boolean> {
        if (this.isStorageDefined()) {
            const pingValue = '__test__ping__';
            const pingKey = '__ping__'
            await this.setItem(pingKey, pingValue);
            const connected = (await this.getItem<string>(pingKey)) === pingValue;
            await this.removeItem(pingKey);
            return connected

        }
        return false;
    }

    /**
     * 
     * @param value 
     * @returns Serialized version of the provided value
     */
    serialize(value: unknown) {
        return JSON.stringify(value);
    }

    /**
     * 
     * @param value 
     * @returns Deserialize stored data to desired object
     */
    deserialize<T>(value: string): T {
        return JSON.parse(value) as T;
    }

    getPrefixedName(name: string): string {
        return this.prefix === undefined ? name: `${this.prefix}__${name}`
    }

    async setItem(key: string, value: unknown): Promise<void> {
        if(value === undefined || value === null) return;
        this.storage.setItem(this.getPrefixedName(key), this.serialize(value));
    }
    async getItem<T = unknown>(key: string): Promise<T | null> {
        const value = this.storage.getItem(this.getPrefixedName(key));
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
        this.storage.removeItem(this.getPrefixedName(key));
    }

    async clear(): Promise<void> {
        this.storage.clear();
    }
    async disconnect(): Promise<void> {
        await this.beforeDisconnectCallback(this);
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
    checkPlatform(): void {
        if (globalThis === undefined || globalThis === null || !isWebPlatform()) {
            throw new UnsuitablePlatformException(`${this.constructor.name} only supports web platform`)
        }
    }
}


export class WebLocalStorage extends BaseWebStorage {

    readonly type = StorageType.Local;

    /**
     * @override
     * 
     * After the verification of platform, which must be web
     * store globalThis.localStorage instance in @property storage
     * Call onConnectCallback after connection
     */
    async connect(): Promise<void> {
        this.checkPlatform();
        this.storage = globalThis.localStorage;
        this.onConnectCallback(this);
    }

}



export class WebSessionStorage extends BaseWebStorage {

    readonly type = StorageType.Session;

    /**
     * @override
     * 
     * After the verification of platform, which must be web
     * store globalThis.sessionStorage instance in @property storage
     * Call onConnectCallback after connection
     */
    async connect(): Promise<void> {
        this.checkPlatform();
        this.storage = globalThis.sessionStorage;
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
        this.checkPlatform();
        if ((globalThis as any)[this.keyName] === undefined) {
            (globalThis as any)[this.keyName] = {};
        }
        this.storage = (globalThis as any)._webWindowStoreAlmight
        this.onConnectCallback(this);
    }


    async isConnected(): Promise<boolean> {
        return (this.storage !== null && (globalThis as any)[this.keyName] !== undefined);
    }

    serialize(value: unknown): string {
        return JSON.stringify(value);
    }

    deserialize<T>(value: string): T {
        return JSON.parse(value) as T;
    }

    /**
     * @override 
     * 
     * Remove the keyName property from globalThis
     */
    async clear(): Promise<void> {
        (globalThis as any)[this.keyName] = {};
    }


    async setItem(key: string, value: unknown): Promise<void> {
        this.storage[key] = this.serialize(value);
    }

    async getItem<T = unknown>(key: string): Promise<T> {
        return this.deserialize<T>(this.storage[key]);
    }

    async removeItem(key: string): Promise<void> {
        delete this.storage[key];
    }

}