export type PoolConfig = {
    poolSize: number;
    poolGetTimeout: number;
    poolRetryInterval: number;
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
