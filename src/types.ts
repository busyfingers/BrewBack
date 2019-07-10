import { Connection, TediousType } from 'tedious';

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

export type PoolItem = {
    connection: Connection;
    status: number;
};

export type Connector = {
    id: number;
    connection: Connection;
};

export type QueryParameter = {
    name: string;
    type: TediousType;
    value: any;
};

// https://stackoverflow.com/questions/30840596/how-to-do-dynamic-objects-in-typescript
// export interface IValue {
//     prop: any;
// }

export interface RowResult {
    [name: string]: string;
}

export type Measurement = {
    value: string;
    location: string;
    measuredAt: string;
};
