import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { type WerkstattModel } from '../../src/werkstatt/controller/werkstatt-get.controller.js';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';

// Testdaten
const idVorhanden = '1';

// Test-Suite
describe('GET /rest/:id', () => {
    let client: AxiosInstance;

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await startServer();
        const baseURL = `https://${host}:${port}/rest`;
        client = axios.create({
            baseURL,
            httpsAgent,
            validateStatus: (status) => status < 500, // eslint-disable-line @typescript-eslint/no-magic-numbers
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    test('Buch zu vorhandener ID', async () => {
        // given
        const url = `/${idVorhanden}`;

        // when
        const { status, headers, data }: AxiosResponse<WerkstattModel> =
            await client.get(url);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);

        // eslint-disable-next-line no-underscore-dangle
        const selfLink = data._links.self.href;

        expect(selfLink).toMatchSnapshot();
    });
});
