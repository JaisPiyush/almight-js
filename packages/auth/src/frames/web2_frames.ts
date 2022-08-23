import { Web2AuthenticationDelegate } from "../delegate";
import { AuthenticationFrame } from "../frame";
import { Web2IdentityResolver } from "../resolvers";
import { AllowedQueryParams, AuthenticationRespondStrategy, RespondMessageData } from "../types";



export class Web2ExternalAuthenticationFrame extends AuthenticationFrame {

    callCount: number = 0

    override async handleSuccessResponse(data: RespondMessageData): Promise<void> {
        // Duplicate call guard
        if (this.callCount !== 0) return;
        this.callCount += 1;

        delete data.messageType;
        delete data.respondType;
        if (data.code !== undefined) {
            const delegate = new Web2AuthenticationDelegate({
                storage: this.app.storage,
            });
            delegate.setIdentityResolver(new Web2IdentityResolver(this.app.getIdentityProvider(data.provider)));
            await delegate.setStates(data);
            const res = await delegate.handleUserRegistration();
            for (const key of Object.keys(data)) {
                await delegate.storage.removeItem(key);
            }
            await delegate.storage.removeItem(AllowedQueryParams.ProjectId);
            if (res.access === undefined) return;
            data.user = await this.app.fetchAndStoreUserData(res.access);
            super.handleSuccessResponse(data);
        }
    }
}

export class Web2NativePopupAuthenticationFrame extends Web2ExternalAuthenticationFrame {
    respondStrategy: AuthenticationRespondStrategy = AuthenticationRespondStrategy.Web;
    frame?: Window;

    override bindListener(): void {
        globalThis.addEventListener("message", (event) => {
            if (event.origin === this.app.baseAuthenticationURL && event.data.channel === "almight_communication_channel") {
                this.onResponsCallback(event.data);
            }
        })
    }

    override async initAuth(data: Record<string, string>): Promise<void> {
        super.initAuth(data);
        await this.app.storage.setItem(AllowedQueryParams.ProjectId, data[AllowedQueryParams.ProjectId]);
        data[AllowedQueryParams.TargetOrigin] = globalThis.location.origin;
        const url = this.generateFrameUri(data);
        const features = "width=800, height=800"
        this.frame = globalThis.open(url, "Authentication Frame", features)
        this.bindListener()

    }

    override async close(): Promise<void> {
        if (!this.frame.closed) this.frame.close();
    }
}