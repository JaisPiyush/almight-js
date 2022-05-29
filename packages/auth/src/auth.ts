import { BaseConnector, ISession } from "connector/lib";
import { BaseStorageInterface, Providers } from "utils/lib";
import { IAuthenticationApp, ResponseMessageCallbackArgument, UserData } from "./types";

export class AuthenticationApp implements IAuthenticationApp{
    storage: BaseStorageInterface;
    connector?: BaseConnector;
    sessions: ISession = [];


    
    onSuccessCallback: (data: ResponseMessageCallbackArgument) => void;
    onFailureCallback: (data: ResponseMessageCallbackArgument) => void;
    getProjectIdentifier(): Promise<string> {
        throw new Error("Method not implemented.");
    }
    getUserIdentifier(): Promise<string> {
        throw new Error("Method not implemented.");
    }
    getUserData(): Promise<UserData> {
        throw new Error("Method not implemented.");
    }
    startAuthentication(provider: Providers): Promise<void> {
        throw new Error("Method not implemented.");
    }
    setCurrentSession(session: ISession): Promise<void> {
        throw new Error("Method not implemented.");
    }
}