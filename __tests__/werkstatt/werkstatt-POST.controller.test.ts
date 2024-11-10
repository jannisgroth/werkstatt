import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { type WerkstattDTO } from '../../src/werkstatt/controller/werkstattDTO.entity.js';
import { WerkstattReadService } from '../../src/werkstatt/service/werkstatt-read.service.js';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';
import { tokenRest } from '../token.js';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const neueWerkstatt: WerkstattDTO = {
    werkstattname: 'Schreinerei Mueller',
    rating: 1,
    art: 'SCHREINEREI',
    homepage: 'https://post.rest',
    schlagwoerter: ['ROHBAU'],
    adresse: {
        postleitzahl: '12345',
        strasse: 'strasse',
        hausnummer: '2',
    },
    angestellte: [
        {
            name: 'Hans',
            position: 'Leiter',
        },
    ],
};
const neueWerkstattInvalid: Record<string, unknown> = {
    werkstattname: 'Schreinerei Rentschler',
    rating: -1,
    art: 'SCHREINEREI',
    homepage: 'https://post.rest',
    schlagwoerter: ['ROHBAU'],
    adresse: {
        postleitzahl: '12345',
        strasse: 'straße',
        hausnummer: '2',
    },
};
// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('POST /rest', () => {
    let client: AxiosInstance;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json', // eslint-disable-line @typescript-eslint/naming-convention
    };

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await startServer();
        const baseURL = `https://${host}:${port}`;
        client = axios.create({
            baseURL,
            httpsAgent,
            validateStatus: (status) => status < 500, // eslint-disable-line @typescript-eslint/no-magic-numbers
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    test('Neue Werkstatt', async () => {
        // given
        const token = await tokenRest(client);
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<string> = await client.post(
            '/rest',
            neueWerkstatt,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.CREATED);

        const { location } = response.headers as { location: string };

        expect(location).toBeDefined();

        // ID nach dem letzten "/"
        const indexLastSlash: number = location.lastIndexOf('/');

        expect(indexLastSlash).not.toBe(-1);

        const idStr = location.slice(indexLastSlash + 1);

        expect(idStr).toBeDefined();
        expect(WerkstattReadService.ID_PATTERN.test(idStr)).toBe(true);

        expect(data).toBe('');
    });

    test('Neue Werkstatt mit ungueltigen Daten', async () => {
        // given
        const token = await tokenRest(client);
        headers.Authorization = `Bearer ${token}`;
        const expectedMsg = [expect.stringMatching(/^rating /u)];

        // when
        const response: AxiosResponse<Record<string, any>> = await client.post(
            '/rest',
            neueWerkstattInvalid,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const messages: string[] = data.message;

        expect(messages).toBeDefined();
        expect(messages).toHaveLength(1);
        expect(messages).toEqual(expect.arrayContaining(expectedMsg));
    });

    test('Neue Werkstatt, aber ohne Token', async () => {
        // when
        const response: AxiosResponse<Record<string, any>> = await client.post(
            '/rest',
            neueWerkstatt,
        );

        // then
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    test('Neue Werkstatt, aber mit falschem Token', async () => {
        // given
        const token = 'FALSCH';
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<Record<string, any>> = await client.post(
            '/rest',
            neueWerkstatt,
            { headers },
        );

        // then
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
});
