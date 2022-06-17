import { AuthenticationRespondStrategy, IAuthenticationDelegate, IOriginFrameCommunicator, RespondMessageType, RespondType } from "./types";

export class BaseOriginFrameCommunicator implements IOriginFrameCommunicator {

    respondStrategy: AuthenticationRespondStrategy = AuthenticationRespondStrategy.None;

    public targetOrigin: string = "*"
    
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

    override async close(): Promise<void> {
        
    }

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


export class WebOriginCommunicator extends BaseOriginFrameCommunicator {
    
    respondStrategy: AuthenticationRespondStrategy = AuthenticationRespondStrategy.Web;



   override async respond(data: Record<string, string>): Promise<void> {
       if(globalThis.parent  === undefined) throw new Error("Frame parent is not defined, type of origin is not suitable");
       data["channel"] = "almight_communication_channel";
       return globalThis.opener.postMessage(this.formatResponse(data), this.targetOrigin as WindowPostMessageOptions);
   }

   override async close(): Promise<void> {
       await globalThis.close()
   }



}


