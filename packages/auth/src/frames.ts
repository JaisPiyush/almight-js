import { Class, isWebPlatform } from "@almight-sdk/utils";
import { BaseChainAdapter, BaseProviderChannel, ConnectorType } from "@almight-sdk/connector";
import { AuthenticationApp } from "./auth";
import { Web3AuthenticationDelegate } from "./delegate";
import { AuthenticationAppIsNotDefinedProperly } from "./exceptions";
import { Web3NativeOriginFrameCommunicator } from "./frame_communicator";
import { AllowedQueryParams, AuthenticationRespondStrategy, IAuthenticationFrame, RespondMessageData, RespondType } from "./types";


export class AuthenticationFrame implements IAuthenticationFrame {

    respondStrategy: AuthenticationRespondStrategy = AuthenticationRespondStrategy.None;
    app?: AuthenticationApp;

    async initAuth(data: Record<string, string>): Promise<void> {
        data[AllowedQueryParams.RespondStrategy] = this.respondStrategy;
        // data[AllowedQueryParams.TargetOrigin] = globalThis.location.origin;
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
        if ((data.respondType === RespondType.Error && data[AllowedQueryParams.Error] !== "Request aborted") || data.access === undefined) {
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



export class Web3NativeAuthenticationFrame extends AuthenticationFrame {
    respondStrategy: AuthenticationRespondStrategy = AuthenticationRespondStrategy.None;
    delegate?: Web3AuthenticationDelegate;

    browserAdapter?: BaseChainAdapter;
    walletconnectAdapter?: BaseChainAdapter;
    deeplinkAdapter?: BaseChainAdapter;

    override bindListener(): void {
        
    }

    // Element will dispatch 'buttonclick' event on button click
    mountModal(): void {
        throw new Error("Method not implemented")
    }

    async handleAuthenticationOnWebNativePlatform(): Promise<void> {
        const adapterClass: Class<BaseChainAdapter> = this.delegate.identityResolver.provider.getAdapterClass() as Class<BaseChainAdapter>;
        const channelClasses: Class<BaseProviderChannel>[] = this.delegate.identityResolver.provider.getChannels();

        
        for (const channelClass of channelClasses){
            const adapter = new adapterClass({
                channel :new channelClass(),
                onConnect: (options?: any) => {
                    options[AllowedQueryParams.ConnectorType] = adapter.channel.connectorType;
                    options["session"] = adapter.getSession();
                    this.delegate.identityResolver.onAuthenticationRedirect(options);
                }
            }); 

            if(adapter.channel.connectorType === ConnectorType.BrowserExtension){
                this.browserAdapter = adapter;
            }else if(adapter.channel.connectorType === ConnectorType.WalletConnector){
                adapter.connect().then(() => {
                    this.walletconnectAdapter = adapter
                })
            }
        }
    }

    override async initAuth(data: Record<string, string>): Promise<void> {
        super.initAuth(data);
        /// setup the delegate and call authentication
        this.delegate = new Web3AuthenticationDelegate({
            storage: this.app.storage,
            respondFrame: new Web3NativeOriginFrameCommunicator({
                onResponse: (data: Record<string, string>) => {
                    this.captureResponse((data as unknown) as RespondMessageData);
                }
            })
        });

        await this.delegate.clean();
        
        await this.delegate.setStates(data)

        await this.delegate.captureData()

        // TODO: Show UI for authentication for web
        if(isWebPlatform()) {
            await this.handleAuthenticationOnWebNativePlatform();
        }
        

    }


}


// export class WebWindowAuthenticationFrame extends AuthenticationFrame {
//     respondStrategy: AuthenticationRespondStrategy = AuthenticationRespondStrategy.Web;
//     frame: Window;
//     override bindListener(): void {
//         globalThis.addEventListener("message", (event) => {
//             if (event.data.channel === "almight_communication_channel") {
//                 this.captureResponse(event.data)
//             }
//         })
//     }

//     override async initAuth(data: Record<string, string>): Promise<void> {
//         super.initAuth(data)
//         const url = this.generateFrameUri(data);
//         const features = "width=800, height=800"
//         this.frame = globalThis.open(url, "Authentication Frame", features)
//         this.bindListener();
//     }

//     override async close(): Promise<void> {
//         if (!this.frame.closed) this.frame.close();
//     }

//     override async handleSuccessResponse(data: RespondMessageData): Promise<void> {
//         if(data.access === undefined) return;
//         await this.app.storeJWTToken(data.access);
//         const userData = await this.app.getUserData(data.access);
//         await this.app.saveUserData(userData);
//         data.user = userData;
//         super.handleSuccessResponse(data);

       
//     }


// }