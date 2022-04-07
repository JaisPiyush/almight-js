
export interface NaiveStorage extends Storage{}


export enum StorageType {
    Session = "SESSION",
    Local = "LOCAL",
    Memory = "None"
}



export interface BaseStorageOptions<T = any> {
    onConnectCallback?: (self: ThisType<T>) => Promise<void>,
    beforeDisconnectCallback?: (self: ThisType<T>) => Promise<void>
}

/**
 * Storage Interface with standard implementations for data transanction process
 * Every StorageAPI must implement {BaseStorageInterface} in order to be eligble for SDK use
 * 
 */
export interface BaseStorageInterface {




    readonly type: StorageType;


    /**
     * Returns boolean value indicating whether the Storage is of provided StorageType
     * 
     * @param type StorageType
     */
    isType(type: StorageType): boolean;

    
    /**
     * @virtual
     * Creates connection with the storage system and save the instance in @property storage
     */
    connect(): Promise<void>;


    /**
     * @virtual
     * Verifies the connection with storage and returns boolean value as Promise
     * 
     *@returns boolean value as Promise indicating connection state
     */
    isConnected(): Promise<boolean>;

    /**
     * Insert the data in the storage as key-value pair
     * The value inserted will be parsed to JSON string
     * 
     * @remarks
     * The method will throw Exception if it fails to insert the data due to any reason 
     * 
     * @param key 
     * @param value 
     */

    setItem(key: string, value: any): Promise<void>;


    getItem<T = any>(key: string): Promise<T>;

    removeItem(key: string): Promise<void>;

    clear(): Promise<void>
    
    /**
     * Disconnects the storage instance and set the @property storage to null
     * 
     * @remarks
     * @method beforeDisconnectCallback must be called before disconnecting the storage
     */
    disconnect(): Promise<void>;



}