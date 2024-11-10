/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { type GraphQLRequest } from '@apollo/server';
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { type GraphQLFormattedError } from 'graphql';
import { type Werkstatt } from '../../src/werkstatt/entity/werkstatt.entity.js';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';

export type GraphQLResponseBody = {
    data?: Record<string, any> | null;
    errors?: readonly [GraphQLFormattedError];
};

type WerkstattDTO = Omit<
    Werkstatt,
    'angestellte' | 'aktualisiert' | 'erzeugt' | 'homepage'
> & {
    homepage: string;
};

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const idVorhanden = '30';

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('GraphQL Queries', () => {
    let client: AxiosInstance;
    const graphqlPath = 'graphql';

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await startServer();
        const baseURL = `https://${host}:${port}/`;
        client = axios.create({
            baseURL,
            httpsAgent,
            // auch Statuscode 400 als gueltigen Request akzeptieren, wenn z.B.
            // ein Enum mit einem falschen String getestest wird
            validateStatus: () => true,
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    test('Werkstatt zu vorhandener ID', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    werkstatt(id: "${idVorhanden}") {
                        version
                        werkstattname
                        rating
                        art
                        homepage
                        schlagwoerter
                        adresse {
                            postleitzahl
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { werkstatt } = data.data!;
        const result: WerkstattDTO = werkstatt;

        expect(result.adresse?.postleitzahl).toMatch(/^\d{5}$/u);
        expect(result.version).toBeGreaterThan(-1);
        expect(result.id).toBeUndefined();
    });

    test('Werkstatt zu nicht-vorhandener ID', async () => {
        // given
        const id = '999999';
        const body: GraphQLRequest = {
            query: `
                {
                    werkstatt(id: "${id}") {
                        adresse {
                            postleitzahl
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.werkstat).toBeUndefined();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error;

        expect(message).toBe(`Es gibt keine Werkstatt mit der Id: ${id}.`);
        expect(path).toBeDefined();
        expect(path![0]).toBe('werkstatt');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });
});
/* eslint-enable @typescript-eslint/no-unsafe-assignment */
