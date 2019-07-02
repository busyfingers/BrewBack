export type PoolConfig = {
    size: number;
    getTimeout: number;
    retryInterval: number;
};

export type DatabaseConfig = {
    server: string;
    authentication: {
        type: string;
        options: {
            userName: string;
            password: string;
        };
    };
    options: {
        database: string;
        useUTC: boolean;
    };
};
