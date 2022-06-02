export class AuthenticationAppIsNotDefinedProperly extends Error{
    constructor(msg: string ="Authentication App is not defined properly"){
        super(msg);
    }
}


export class IncompatiblePlatformForAuthenticationDelegate extends Error {
    constructor(){
        super("Current platform is in-compatible for authentication delegate")
    }
}


export class InvalidProjectIdError extends Error {
    constructor(projectId: string){
        super(`Project with project id ${projectId} is invalid`)
    }
}


export class StorageIsNotConnected extends Error {
    constructor(msg: string = "No storage is connected with system"){
        super(msg)
    }
}

