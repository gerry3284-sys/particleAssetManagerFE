import { LogLevel, Configuration, BrowserCacheLocation } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: '6618f68e-5225-4b93-ae0c-42eb4425432e',
    authority: 'https://login.microsoftonline.com/cf945c81-7814-4635-97ff-08679498fdc3',
    redirectUri: 'http://localhost:4200',
    postLogoutRedirectUri: 'http://localhost:4200/login'
  },
  cache: {
    cacheLocation: BrowserCacheLocation.LocalStorage
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Warning
    }
  }
};

// Scopes per il login (dati utente base)
/*export const loginRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read']
};*/

// Scope per chiamare il tuo BE Java
/*export const apiRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read']
};*/

/*export const graphRequest = {
  scopes: ['User.Read', 'GroupMember.Read.All']
};*/

export const loginRequest = {
  scopes: ['openid', 'profile', 'email']
};

export const apiRequest = {
  scopes: ['api://6618f68e-5225-4b93-ae0c-42eb4425432e/User.Read']  // solo il tuo BE
};

export const graphRequest = {
  scopes: [
    'https://graph.microsoft.com/User.Read',
    'https://graph.microsoft.com/GroupMember.Read.All'
  ]
};



/*export const loginRequest = {
  scopes: ['openid', 'profile', 'email', 'api://6618f68e-5225-4b93-ae0c-42eb4425432e/User.Read']
};

export const apiRequest = {
  scopes: ['api://6618f68e-5225-4b93-ae0c-42eb4425432e/User.Read']
};

export const graphRequest = {
  scopes: ['https://graph.microsoft.com/User.Read'],
};*/