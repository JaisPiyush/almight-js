
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

export class IncompatibleSessionData extends Error {
    constructor(msg: string = "Provided session data is in-compatible with the current channel"){
        super(msg);
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


export class AdapterIsNotDefined extends Error {
    constructor(){
        super("No adapter is defined for establishing connection with provider.")
    }
}

export class NoSuitableAdapterFound extends Error {
    constructor(){
        super("No suitable adapter is found for establishing connection with provider.")
    }
}


export class ConnectionEstablishmentFailed extends Error {

    constructor(msg: string = "Connector failed to establish any connection"){
        super(msg)
    }
}

export class ChannelConnectionEstablishmentFailed extends Error {
    constructor(msg: string = "Channel failed to establish any connection"){
        super(msg)
    }
}