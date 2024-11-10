import { UseFilters } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Public } from 'nest-keycloak-connect';
import { getLogger } from '../../logger/logger.js';
import { type Suchkriterien } from '../service/suchkriterien.js';
import { WerkstattReadService } from '../service/werkstatt-read.service.js';
import { HttpExceptionFilter } from './http-exception.filter.js';

export type IdInput = {
    readonly id: number;
};

export type SuchkriterienInput = {
    readonly suchkriterien: Suchkriterien;
};

@Resolver('Werkstatt')
@UseFilters(HttpExceptionFilter)
export class WerkstattQueryResolver {
    readonly #service: WerkstattReadService;

    readonly #logger = getLogger(WerkstattQueryResolver.name);

    constructor(service: WerkstattReadService) {
        this.#service = service;
    }

    @Query('werkstatt')
    @Public()
    async findById(@Args() { id }: IdInput) {
        this.#logger.debug('findById: id=%d', id);

        const werkstatt = await this.#service.findById({ id });

        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug(
                'findbyId: werkstatt=%s, adresse=%o',
                werkstatt.toString,
                werkstatt.adresse,
            );
        }
        return werkstatt;
    }

    @Query('werkstaette')
    @Public()
    async find(@Args() input: SuchkriterienInput | undefined) {
        this.#logger.debug('find: input=%o', input);
        const werkstaette = await this.#service.find(input?.suchkriterien);
        this.#logger.debug('find: werkstaette=%o', werkstaette);
        return werkstaette;
    }
}
