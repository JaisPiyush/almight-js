import { AuthenticationApp } from "@almight-sdk/auth";
import { AlmightClient } from "@almight-sdk/core";
import { WebLocalStorage } from "@almight-sdk/utils";

const almight = new AlmightClient({
    apiKey: (process.env.REACT_APP_ALMIGHT_API_KEY) as string,
    storage: new WebLocalStorage()
  });

const auth = new AuthenticationApp({
  almightClient: almight,
});

export {auth};
export default almight;