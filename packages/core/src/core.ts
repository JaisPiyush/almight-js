import { BaseStorageInterface, Chainset, ChainsManager, IMetaDataSet, isWebPlatform } from "utils/lib";
import { projectAxiosInstance } from "./axios_clients";
import { InvalidAPIKey } from "./excpetions";
import { IAlmightClient } from "./types";

export interface AlmightClientConstructorOptions {
    apiKey: string;
    storage: BaseStorageInterface;
    providerMetaData?: Record<string, IMetaDataSet>;
    chainsetRecord?: Record<string, Chainset>;
    chainManager?: ChainsManager
}
export class AlmightClient implements IAlmightClient {
  
    apiKey: string;
    storage: BaseStorageInterface;

    readonly projectPropertyKeyName = "almight_project"

    constructor(options: AlmightClientConstructorOptions){
        this.apiKey = options.apiKey;
        this.storage = options.storage;
        this.storage.connect().then();
        if(options.providerMetaData !== undefined) {
            this.setProviderMetaData(options.providerMetaData);
        }
        if(options.chainsetRecord !== undefined){
            this.setChainSetRecord(options.chainsetRecord);
        }
        if(options.chainManager !== undefined){
            this.setChainManager(options.chainManager);
        }
    }


    setProviderMetaData(metaData: Record<string, IMetaDataSet>): void {
        Object.defineProperty(globalThis, "META_DATA_SET", {
            value: metaData,
            writable: true,
            configurable: true
        });
    }

    setChainSetRecord(chainsetRecord: Record<string, Chainset>): void{
        Object.defineProperty(globalThis, "CHAINSET_RECORD", {
            value: chainsetRecord,
            writable: true,
            configurable: true
        });
    }

    setChainManager(chainManager: ChainsManager): void {
        Object.defineProperty(globalThis, "chainManager", {
            value: chainManager,
            writable: true,
            configurable: true
        });
    }


    async isAPIKeyValid(): Promise<boolean> {
        const res = await projectAxiosInstance.post<{is_valid: boolean}>("/project/verify/api_key",{
            "api_key": this.apiKey
        });
        return res.data.is_valid === true
    }

    async getProjectIdentifier(): Promise<string> {
        if(! await this.isAPIKeyValid()) throw new InvalidAPIKey()
        const res = await projectAxiosInstance.post<{identifier: string}>("/project/ident", {}, {
            headers: {
                "X-API-KEY": this.apiKey
            }
        });
        return res.data.identifier;
    }


}