import { Injectable, NotFoundException } from '@nestjs/common';
import { getLogger } from '../../logger/logger.js';
import { Werkstatt } from '../entity/werkstatt.entity.js';
import { QueryBuilder } from './query-builder.js';
import { Suchkriterien } from './suchkriterien.js';

export type FindByIdParams = {
    readonly id: number;
    readonly mitAngestellten?: boolean;
};
@Injectable()
export class WerkstattReadService {
    static readonly ID_PATTERN = /^[1-9]\d{0,10}$/u;

    readonly #werkstattProps: string[];

    readonly #queryBuilder: QueryBuilder;

    readonly #logger = getLogger(WerkstattReadService.name);

    constructor(queryBuilder: QueryBuilder) {
        const werkstattDummy = new Werkstatt();
        this.#werkstattProps = Object.getOwnPropertyNames(werkstattDummy);
        this.#queryBuilder = queryBuilder;
    }

    /**
     * @param param0 Werkstatt suchen mit ID.
     */
    async findById({ id, mitAngestellten = false }: FindByIdParams) {
        this.#logger.debug('findById: id=%d', id);

        const werkstatt = await this.#queryBuilder
            .buildId({ id, mitAngestellten })
            .getOne();
        if (werkstatt === null) {
            throw new NotFoundException(
                `Es gibt keine Werkstatt mit der Id: ${id}.`,
            );
        }
        if (werkstatt.schlagwoerter === null) {
            werkstatt.schlagwoerter = [];
        }

        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug(
                'findById: werkstatt=%s, name=%o',
                werkstatt.toString(),
                werkstatt.werkstattname,
            );
            if (mitAngestellten) {
                this.#logger.debug(
                    'findById: angestellen=%o',
                    werkstatt.angestellte,
                );
            }
        }
        return werkstatt;
    }

    async find(suchkriterien?: Suchkriterien) {
        this.#logger.debug('find: suchkriterien=%o', suchkriterien);

        if (suchkriterien === undefined) {
            return this.#queryBuilder.build({}).getMany();
        }
        const keys = Object.keys(suchkriterien);
        if (keys.length === 0) {
            return this.#queryBuilder.build(suchkriterien).getMany();
        }

        if (!this.#checkKeys(keys)) {
            throw new NotFoundException('Ungültigere Suchkriterien');
        }

        const werkstaette = await this.#queryBuilder
            .build(suchkriterien)
            .getMany();
        if (werkstaette.length === 0) {
            this.#logger.debug('find: Keine Werkstätte gefunden');
            throw new NotFoundException(
                `Keine Werkstätte gefunden: ${JSON.stringify(suchkriterien)}`,
            );
        }
        werkstaette.forEach((werkstatt) => {
            if (werkstatt.schlagwoerter === null) {
                werkstatt.schlagwoerter = [];
            }
        });
        this.#logger.debug('find: werkstätte=%o', werkstaette);
        return werkstaette;
    }

    #checkKeys(keys: string[]) {
        let validKeys = true;
        keys.forEach((key) => {
            if (
                !this.#werkstattProps.includes(key) &&
                key !== 'fertigbau' &&
                key !== 'rohbau'
            ) {
                this.#logger.debug(
                    '#checkKeys: ungueltiges Suchkriterium "%s"',
                    key,
                );
                validKeys = false;
            }
        });

        return validKeys;
    }
}
