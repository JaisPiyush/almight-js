import {BaseStorageInterface} from "@almight-sdk/utils"




export interface IAlmightClient {

    apiKey: string;
    storage: BaseStorageInterface;
    isAPIKeyValid(): Promise<boolean>;
    getProjectIdentifier(): Promise<string>;

}