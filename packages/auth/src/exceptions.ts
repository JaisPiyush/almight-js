export class AuthenticationAppIsNotDefinedProperly extends Error{
    constructor(msg: string ="Authentication App is not defined properly"){
        super(msg);
    }
}