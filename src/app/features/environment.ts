import { EnvironmentInterface } from "./environmentInterface";

export const environment: EnvironmentInterface = {
  production: false,
  msalConfig: {
    auth: {
      clientId: '24999ebf-93b2-4802-8938-c720138915a1',//'3cbbf6a1-c8a4-49af-9c81-ba5ef383d122',
      authority: 'https://login.microsoftonline.com/cf945c81-7814-4635-97ff-08679498fdc3/oauth2/v2.0/authorize', //'https://login.microsoftonline.com/cf945c81-7814-4635-97ff-08679498fdc3/oauth2/v2.0/authorize'
    }
  },
  app: {
    baseHref: '/',
  },
  apiConfig: {
    scopes: ['user.read'],
    uri: 'https://graph.microsoft.com/v1.0/me'
  },
  logger: false,
  api: {
    //baseUrl: '/api'
    baseUrl: 'http://localhost:8080'
  }
};

/*export const environment = {
   production: false,
  apiUrl: 'http://localhost:8080'
};*/