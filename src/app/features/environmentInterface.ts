export interface EnvironmentInterface {
    production: boolean;
    msalConfig: {
        auth: {
            clientId: string;
            authority: string;
        };
    };
    app: {
        baseHref: string;
    };
    apiConfig: {
        scopes: string[];
        uri: string;
    };
    logger: boolean;
    api: {
        baseUrl: string;
    };
}