import { AuthenticationDelegate, Web2AuthenticationDelegate } from "../delegate";
import { IdentityResolver } from "./resolver";


export class Web2IdentityResolver extends IdentityResolver{

    public delegate: Web2AuthenticationDelegate;

    
    
}