import { AuthenticationRespondStrategy, IAuthenticationDelegate, IOriginFrameCommunicator, RespondMessageType, RespondType } from "./types";

export class BaseOriginFrameCommunicator implements IOriginFrameCommunicator {

    respondStrategy: AuthenticationRespondStrategy = AuthenticationRespondStrategy.None;

    
    async close(): Promise<void> {
        throw new Error("Method not implemented.");
    }


    async respondSuccess(data: Record<string, string>): Promise<void> {
        data["respondType"] = RespondType.Success;
        return await this.respond(data);
    }
    async respondFailure(data: Record<string, string>): Promise<void> {
        data["respondType"] = RespondType.Error;
        return await this.respond(data);
    }

    formatResponse(data: Record<string, string>): any {
        data["messageType"] = data["messageType"] ?? RespondMessageType.Message;
        return data;

    }

    async respond(data: Record<string, string>): Promise<void> {
        throw new Error("Method not implemented.");
    }

}


export class Web3NativeOriginFrameCommunicator extends BaseOriginFrameCommunicator {
    respondStrategy: AuthenticationRespondStrategy = AuthenticationRespondStrategy.None;

    onResponseCallback: (data: Record<string, string>) => void;

    override async respond(data: Record<string, string>): Promise<void> {
        await this.close();
        this.onResponseCallback(data);
    }


    constructor(options: {
        onResponse: (data: Record<string, string>) => void
    }) {
        super();
        this.onResponseCallback = options.onResponse;

    }
}



