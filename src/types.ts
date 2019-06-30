export type ApplicationConfig {
    dbServer: string;
    dbUser: string;
    dbPass: string;
    dbName: string;
    dbPoolSize: number;
    dbPoolGetTimeout: number;
    dbPoolRetryInterval: number;
}
