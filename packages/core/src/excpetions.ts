export class InvalidAPIKey extends Error{
    constructor(msg: string = "Provided API Key is invalid"){
        super(msg)
    }
}