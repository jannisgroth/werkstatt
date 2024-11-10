// eslint-disable-next-line @eslint-community/eslint-comments/disable-enable-pair
/* eslint-disable max-classes-per-file */
import { UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { IsInt, IsNumberString, Min } from 'class-validator';
import { AuthGuard, Roles } from 'nest-keycloak-connect';
import { getLogger } from '../../logger/logger.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { WerkstattDTO } from '../controller/werkstattDTO.entity.js';
import { type Adresse } from '../entity/adresse.entity.js';
import { type Angestellter } from '../entity/angestellter.entity.js';
import { type Werkstatt } from '../entity/werkstatt.entity.js';
import { WerkstattWriteService } from '../service/werkstatt-write.service.js';
import { HttpExceptionFilter } from './http-exception.filter.js';
import { IdInput } from './werkstatt-query.resolver.js';

export type CreatePayload = {
    readonly id: number;
};

export type UpdatePayload = {
    readonly version: number;
};

export class WerkstattUpdateDTO extends WerkstattDTO {
    @IsNumberString()
    readonly id!: string;

    @IsInt()
    @Min(0)
    readonly version!: number;
}
@Resolver('Werkstatt')
@UseGuards(AuthGuard)
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ResponseTimeInterceptor)
export class WerkstattMutationResolver {
    readonly #service: WerkstattWriteService;

    readonly #logger = getLogger(WerkstattMutationResolver.name);

    constructor(service: WerkstattWriteService) {
        this.#service = service;
    }

    @Mutation()
    @Roles({ roles: ['admin', 'user'] })
    async create(@Args('input') werkstattDTO: WerkstattDTO) {
        this.#logger.debug('create: werkstattDTO=%o', werkstattDTO);

        const werkstatt = this.#werkstattDtoToWerkstatt(werkstattDTO);
        const id = await this.#service.create(werkstatt);
        this.#logger.debug('createWerkstatt: id=%d', id);
        const payload: CreatePayload = { id };
        return payload;
    }

    @Mutation()
    @Roles({ roles: ['admin', 'user'] })
    async update(@Args('input') werkstattDTO: WerkstattUpdateDTO) {
        this.#logger.debug('update: werkstatt=%o', werkstattDTO);

        const werkstatt = this.#werkstattUpdateDtoToWerkstatt(werkstattDTO);
        const versionStr = `"${werkstattDTO.version.toString()}"`;

        const versionResult = await this.#service.update({
            id: Number.parseInt(werkstattDTO.id, 10),
            werkstatt,
            version: versionStr,
        });
        this.#logger.debug('updateWerkstatt: versionResult=%d', versionResult);
        const payload: UpdatePayload = { version: versionResult };
        return payload;
    }

    @Mutation()
    @Roles({ roles: ['admin'] })
    async delete(@Args() id: IdInput) {
        const idStr = id.id;
        this.#logger.debug('delete: id=%s', id);
        const deletePerformed = await this.#service.delete(idStr);
        this.#logger.debug(
            'deleteWerkstatt: deletePerfomed=%s',
            deletePerformed,
        );
        return deletePerformed;
    }

    #werkstattDtoToWerkstatt(werkstattDTO: WerkstattDTO): Werkstatt {
        const adresseDTO = werkstattDTO.adresse;
        const adresse: Adresse = {
            id: undefined,
            postleitzahl: adresseDTO.postleitzahl,
            strasse: adresseDTO.strasse,
            hausnummer: adresseDTO.hausnummer,
            werkstatt: undefined,
        };
        const angestellte = werkstattDTO.angestellte?.map((angestellterDTO) => {
            const angestellter: Angestellter = {
                id: undefined,
                name: angestellterDTO.name,
                position: angestellterDTO.position,
                werkstatt: undefined,
            };
            return angestellter;
        });
        const werkstatt: Werkstatt = {
            id: undefined,
            version: undefined,
            werkstattname: werkstattDTO.werkstattname,
            rating: werkstattDTO.rating,
            art: werkstattDTO.art,
            homepage: werkstattDTO.homepage,
            schlagwoerter: werkstattDTO.schlagwoerter,
            adresse,
            angestellte,
            erzeugt: new Date(),
            aktualisiert: new Date(),
        };

        werkstatt.adresse!.werkstatt = werkstatt;
        return werkstatt;
    }

    #werkstattUpdateDtoToWerkstatt(
        werkstattDTO: WerkstattUpdateDTO,
    ): Werkstatt {
        return {
            id: undefined,
            version: undefined,
            werkstattname: werkstattDTO.werkstattname,
            rating: werkstattDTO.rating,
            art: werkstattDTO.art,
            homepage: werkstattDTO.homepage,
            schlagwoerter: werkstattDTO.schlagwoerter,
            adresse: undefined,
            angestellte: undefined,
            erzeugt: undefined,
            aktualisiert: new Date(),
        };
    }
}
