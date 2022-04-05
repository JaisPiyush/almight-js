# `All-In-One Authentication System`



### Implementation of Authentication System on web

```ts
import {Iframe, User} from "almight-sdk/auth";
import {WebWalletConnector} from "almight-sdk/connector";
import {WebStorage} from "almight-sdk/utils/storage";

// Typescript code for authentication implementation on web
// Initialise the AlmightApp 
const app = new AlmightApp(apiKey:"");


const auth_app = new AuthenticationApp({
    app: app, //AlmightApp
    frame: Iframe, // Iframe will be spawned for authentication
    storage: WebStorage, // Storage API which is used to store authentication datas
    //Wallet connector that provides API for wallet communication from  web
    walletConnector: WebWalletConnector,
    onSuccess: (user: User) => {
        // code after successful authentication
    },
    onError: (error: Error) => {
        // code for error handling
    }
});

```

The Authentication flow will be decided by the _*Provider*_ provided in the `auth_app.authenticateWithProvider` function. 
The function will start an  `Popup iframe` for authentication. In case of Web2 sign-in such as Google Signin, Fb Signin, Github Signin, Twitter Signin the default OAuth method of authentication will be implemented to authenticate the user. 
In case of Web3 wallet based authentications, `WebWalletConnector` will be used to establish connection with the wallet. 
* If the Dapp is running on **desktop browser**, it will show options to connect using browser extension or QR scan.
* If the Dapp is running on **mobile browser**, it will show options to connect using `deeplinks` or QR scan
* In case of native mobile apps, `CustomeChromeTab` or `SafariViewController` will be used to replace iframe and authentication flow of **mobile browser** will be followed

```ts
// Starting the authentication flow for Web2 Google Sign-in or Web3 Wallet sign-in


auth_app.authenticateWithProvider(Providers.Google);

// The authentication app will verify the user's identification.
// upon successfull identification the JWT of the user will stored in the cookie
// User's meta-data such as email, name and image_url will be stored in Session storage
// And onSuccess callback will be called with user data as argument

// On authentication failure the error message will be delivered to the user
// through onError callback

```

```ts
// Whenever a user re-visits on the Dapp
// isAuthenticated API must be implemented to check if the user is authenticated
// isAuthenticated API will also pull the user's meta-data and will store in the Session storage
const isAuthenticated = await auth_app.isAuthenticated();
```

The Implementation for authentication will work perfectly on react-native after  adding permissions and config files to user Storage and ChromeCustomTab or SafariViewController and replacing
* `Iframe` to `ReactNativeFrame` (which will determine to use ChromeCustomTab or SafariViewController )
* `WebStorage` to `ReactNativeStorage`

And they'll need to add
```ts
// This method will bind an even listener to capture response from ChromeCustomTab or SafariViewController
auth_app.bindReactNativeIntentListener(Linking);
```

