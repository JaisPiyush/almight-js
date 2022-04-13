

export class UnsuitablePlatformException extends Error {

    constructor(msg: string){
        super(msg);
    }
}

export class AsyncCallTimeOut extends Error {
    constructor(){
        super("Request timemout for the async call")
    }
}

