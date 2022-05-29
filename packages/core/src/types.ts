import {BaseStorageInterface} from "@almight-sdk/utils"

export interface IAlmightClient {

    apiKey: string;
    storage: BaseStorageInterface;
    getProjectIdentifier(): Promise<string>;

}