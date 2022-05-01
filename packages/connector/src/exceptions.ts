
export class IncompatiblePlatform extends Error {
    constructor(){
        super("The platform is in-compatible with the selected provider channel")
    }
}

export class ProviderConnectionError extends Error {
    constructor(){
        super(`Provider is not connected, please try to re-establish connection`)
    }
}


export class SessionIsNotDefined extends Error {
    constructor(){
        super(`Session for the provider is not defined, try setting session data`)
    }
}


export class ProviderRequestTimeout extends Error {
    constructor(){
        super("Provider request call timeout")
    }
}

export class ChannelIsNotDefined extends Error {
    constructor(name: string){
        super(`${name} provider has no channel defined, requires one channel to communicate`)
    }
}