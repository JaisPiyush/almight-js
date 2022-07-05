
export interface NaiveStorage extends Storage{}


export enum StorageType {
    Session = "SESSION",
    Local = "LOCAL",
    Memory = "None"
}



export interface BaseStorageOptions<T = any> {
    onConnectCallback?: (self: ThisType<T>) => void,
    beforeDisconnectCallback?: (self: ThisType<T>) => void
}

/**
 * Storage Interface with standard implementations for data transanction process
 * Every StorageAPI must implement {BaseStorageInterface} in order to be eligble for SDK use
 * 
 */
export interface BaseStorageInterface {




    readonly type: StorageType;
    prefix?: string;


    getPrefixedName(name: string): string;


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
     * Returns bool indicating @property storage is defined
     */
    isStorageDefined(): boolean;


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


    getItem<T = any>(key: string): Promise<T | null>;

 
    hasKey(key: string): Promise<boolean>;

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

// Class constructor signature
export type Class<T, C= any> = new (...args: C[]) => T;


export interface ChainData {
    name: string;
    chainId: number;
    isTestnet: boolean;
    currency?: string;
}

export interface IChainsetData {
    name: string;
    identifier: string;
    chainIds: number[];
    mainnetId: number;
    chainNets: ChainData[];
    mainnet: ChainData;
    icon: string,
    currency: string
}


export interface IChainset extends IChainsetData {
    addChain(chain: ChainData): void;
    getChainDataFromName(name: string): ChainData | undefined;
    isChainPartOfChainSet(chainId: number): boolean;
    getChainDataFromChainId(chainId: number): ChainData | undefined;
    getChainIds(): number[]
}