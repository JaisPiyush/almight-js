import { ConnectorType } from "@almight-sdk/connector";
import { AuthenticationAppIsNotDefinedProperly } from "./exceptions";
import { AllowedQueryParams, AuthenticationFrameConfiguration, AuthenticationRespondStrategy, IAuthenticationApp, IAuthenticationFrame, RespondMessageData, RespondType } from "./types";


export class AuthenticationFrame implements IAuthenticationFrame {



    respondStrategy: AuthenticationRespondStrategy = AuthenticationRespondStrategy.None;
    app?: IAuthenticationApp;
    configs: AuthenticationFrameConfiguration;


    async initAuth(data: Record<string, string>): Promise<void> {
        data[AllowedQueryParams.RespondStrategy] = this.respondStrategy;
        // data[AllowedQueryParams.TargetOrigin] = globalThis.location.origin;
    }


    constructor(configs?: AuthenticationFrameConfiguration) {
        this.configs = configs ?? {
            channelArgs: {}
        }
    }


    getConfigForChannelWithConnectorType(connectorType: ConnectorType): Record<string, any> | undefined {
        if (this.configs === undefined || this.configs.channelArgs === undefined || this.configs.channelArgs[connectorType] === undefined) return;
        return this.configs.channelArgs[connectorType];
    }



    bindListener(): void {
        throw new Error("Method not implemented.");
    }

    async close(): Promise<void> {

        throw new Error("Method not implemented.");
    }

    async captureResponse(data: RespondMessageData): Promise<void> {
        await this.close();
        this.onResponsCallback(data);
    }

    onResponsCallback(data: RespondMessageData): void {
        // console.log("response", data, this.app)
        if (this.app === undefined) throw new AuthenticationAppIsNotDefinedProperly()
        if ((data.respondType === RespondType.Error && data[AllowedQueryParams.Error] !== "Request aborted")) {
            this.app.onFailureCallback({
                [AllowedQueryParams.Error]: data[AllowedQueryParams.Error],
                [AllowedQueryParams.ErrorCode]: data[AllowedQueryParams.ErrorCode]
            });
            return;
        }
        // Implement Success
        try {
            this.handleSuccessResponse(data);
        } catch (e) {
            this.app.onFailureCallback({
                [AllowedQueryParams.Error]: (e as Error).message,
                [AllowedQueryParams.ErrorCode]: data[AllowedQueryParams.ErrorCode]
            });
        }
    }

    async handleSuccessResponse(data: RespondMessageData): Promise<void> {
        delete data.messageType;
        delete data.respondType;
        if (data.refresh !== undefined) {
            delete data.refresh;
            delete data.access;
        }
        this.app.onSuccessCallback(data.user);
    }

    generateFrameUri(data: Record<string, string>): string {
        const baseUrl = `${this.app.baseAuthenticationURL}/auth/v1/init`;
        const url = new URL(baseUrl);
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                url.searchParams.append(key, value)
            }
        }

        return encodeURI(url.toString());

    }

}

