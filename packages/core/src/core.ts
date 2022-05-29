import { BaseStorageInterface } from "utils/lib";
import { IAlmightClient } from "./types";


export class AlmightClient implements IAlmightClient {
    apiKey: string;
    storage: BaseStorageInterface;
    getProjectIdentifier(): Promise<string> {
        throw new Error("Method not implemented.");
    }
}