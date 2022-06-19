import { AuthenticationRespondStrategy, ErrorResponseMessageCallbackArgument, IOriginFrameCommunicator, RespondMessageData, RespondMessageType, RespondType, ResponseMessageCallbackArgument, SuccessResponseMessageCallbackArgument } from "./types";

export class BaseOriginFrameCommunicator implements IOriginFrameCommunicator {

    respondStrategy: AuthenticationRespondStrategy = AuthenticationRespondStrategy.None;

    public targetOrigin: string = "*"
    
    async close(): Promise<void> {
        throw new Error("Method not implemented.");
    }


    async respondSuccess(data: SuccessResponseMessageCallbackArgument): Promise<void> {
        data["respondType"] = RespondType.Success;
        return await this.respond(this.formatResponse(data));
    }
    async respondFailure(data: ErrorResponseMessageCallbackArgument): Promise<void> {
        data["respondType"] = RespondType.Error;
        return await this.respond(this.formatResponse(data));
    }

    formatResponse(data: ResponseMessageCallbackArgument): RespondMessageData {
        data["messageType"] = data["messageType"] ?? RespondMessageType.Message;
        return data as RespondMessageData;

    }

    async respond(data: RespondMessageData): Promise<void> {
        throw new Error("Method not implemented.");
    }

}


export class Web3NativeOriginFrameCommunicator extends BaseOriginFrameCommunicator {
    respondStrategy: AuthenticationRespondStrategy = AuthenticationRespondStrategy.None;

    override async close(): Promise<void> {
        
    }

    onResponseCallback: (data: RespondMessageData) => void;

    override async respond(data:RespondMessageData): Promise<void> {
        await this.close();
        this.onResponseCallback(data);
    }


    constructor(options: {
        onResponse: (data: RespondMessageData) => void
    }) {
        super();
        this.onResponseCallback = options.onResponse;

    }
}


export class WebOriginCommunicator extends BaseOriginFrameCommunicator {
    
    respondStrategy: AuthenticationRespondStrategy = AuthenticationRespondStrategy.Web;



   override async respond(data: RespondMessageData): Promise<void> {
       if(globalThis.parent  === undefined) throw new Error("Frame parent is not defined, type of origin is not suitable");
       data["channel"] = "almight_communication_channel";
       return globalThis.opener.postMessage(this.formatResponse(data), this.targetOrigin as WindowPostMessageOptions);
   }

   override async close(): Promise<void> {
       await globalThis.close()
   }



}


