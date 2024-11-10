import {
    HttpStatus,
    type INestApplication,
    ValidationPipe,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { v2 as compose } from 'docker-compose';
import isPortReachable from 'is-port-reachable';
import { Agent } from 'node:https';
import path from 'node:path';
import { AppModule } from '../src/app.module.js';
import { config } from '../src/config/app.js';
import { dbType } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { nodeConfig } from '../src/config/node.js';
import { paths } from '../src/config/paths.js';
import { typeOrmModuleOptions } from '../src/config/typeormOptions.js';

export const tokenPath = `${paths.auth}/${paths.token}`;
export const refreshPath = `${paths.auth}/${paths.refresh}`;

export const { host, port } = nodeConfig;

const { httpsOptions } = nodeConfig;

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const dbPort: number = (typeOrmModuleOptions as any).port;

const dockerComposeDir = path.join('.extras', 'compose');

let dbHealthCheck: string;

if (dbType === 'postgres') {
    dbHealthCheck = 'until pg_isready: do sleep 1; done';
}

const startDbServer = async () => {
    const isDBReachable = await isPortReachable(dbPort, { host: 'localhost' });

    if (isDBReachable) {
        console.info('DB-Server bereits gestartet.');
        return;
    }

    // Starten von Conatainer
    console.info('Docker-Container mit DB-Server wird gestartet.');
    try {
        await compose.upAll({
            cwd: dockerComposeDir,
            commandOptions: [dbType],
            composeOptions: [['-f', `compose.${dbType}.yml`]],
            // Logging beim Hochfahren des DB-Containers
            log: true,
        });
    } catch (err: unknown) {
        console.error(`startDbServer: ${JSON.stringify(err)}`);
        return;
    }

    // Bereit für DB Abfragen?
    await compose.exec(dbType, ['sh', '-c', dbHealthCheck], {
        cwd: dockerComposeDir,
    });
    console.info('docker-container mit db server ist gestartet');
};

const shutdownDbServer = async () => {
    await compose.down({
        cwd: dockerComposeDir,
        composeOptions: [['-f', 'compose.postgres.yml']],
        log: true,
    });
};

// Testserver mit HTTPS
let server: INestApplication;

export const startServer = async () => {
    if (
        env.START_DB_SERVER === 'true' ||
        env.START_DB_SERVER === 'TRUE' ||
        config.tests?.startDbServer === true
    ) {
        console.info('DB-Server muss gestartet werden');
        await startDbServer();
    }

    server = await NestFactory.create(AppModule, {
        httpsOptions,
        logger: ['log'],
    });
    server.useGlobalPipes(
        new ValidationPipe({
            errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    );

    await server.listen(port);
    return server;
};

export const shutdownServer = async () => {
    try {
        await server.close();
    } catch {
        console.warn('Der Server wurde fehlerhaft beendet.');
    }

    if (env.START_DB_SERVER === 'true' || env.START_DB_SERVER === 'TRUE') {
        await shutdownDbServer();
    }
};

// fuer selbst-signierte Zertifikate
export const httpsAgent = new Agent({
    requestCert: true,
    rejectUnauthorized: false,
    ca: httpsOptions.cert as Buffer,
});
