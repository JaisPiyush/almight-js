import { AuthenticationAppIsNotDefinedProperly } from "./exceptions";
import { AllowedQueryParams, AuthenticationRespondStrategy, IAuthenticationApp, IAuthenticationFrame, RespondMessageData, RespondMessageType, RespondType } from "./types";


export class AuthenticationFrame implements IAuthenticationFrame {

    respondStrategy: AuthenticationRespondStrategy = AuthenticationRespondStrategy.None;
    app?: IAuthenticationApp;

    async initAuth(data: Record<string, string>): Promise<void> {
        data[AllowedQueryParams.RespondStrategy] = this.respondStrategy;
        data[AllowedQueryParams.TargetOrigin] = globalThis.location.origin;
    }

    bindListener(): void {
        throw new Error("Method not implemented.");
    }

    async close(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async captureResponse(data: RespondMessageData): Promise<void> {
        if (data.messageType === RespondMessageType.CloseEvent) {
            await this.close();
            return;
        }
        this.onResponsCallback(data);
    }

    onResponsCallback(data: RespondMessageData): void {
        if (this.app === undefined) throw new AuthenticationAppIsNotDefinedProperly()
        if (data.respondType === RespondType.Error) {
            this.app.onFailureCallback({
                [AllowedQueryParams.Error]: data[AllowedQueryParams.Error],
                [AllowedQueryParams.ErrorCode]: data[AllowedQueryParams.ErrorCode]
            });
            return;
        }
        // Implement Success
        this.handleSuccessResponse(data);
    }

    async handleSuccessResponse(data: RespondMessageData): Promise<void> {
        // TODO: Set Tokens, store data and other things setup Axios to use cookie in case
        console.log(data)
        delete data.messageType;
        delete data.respondType;
        this.app.onSuccessCallback(data);
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


export class WebWindowAuthenticationFrame extends AuthenticationFrame {
    respondStrategy: AuthenticationRespondStrategy = AuthenticationRespondStrategy.Web;
    frame: Window;
    override bindListener(): void {
        globalThis.addEventListener("message", (event) => {
            console.log(event.data, event.origin);
            
            if(event.origin === window.location.origin && event.data.channel === "almight_communication_channel"){
                console.log(event.data);
                this.onResponsCallback(event.data);
            }
        })
    }

    override async initAuth(data: Record<string, string>): Promise<void> {
        super.initAuth(data)
        const url = this.generateFrameUri(data);
        const features = "width=800, height=800"
        this.frame = globalThis.open(url, "Authentication Frame", features)
        this.bindListener();
    }

    override async close(): Promise<void> {
        if(!this.frame.closed) this.frame.close();
    }


}