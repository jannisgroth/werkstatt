// eslint-disable-next-line max-classes-per-file
import {
    Controller,
    Get,
    Headers,
    HttpStatus,
    NotFoundException,
    Param,
    Query,
    Req,
    Res,
    UseInterceptors,
} from '@nestjs/common';
import {
    ApiHeader,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiProperty,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from 'nest-keycloak-connect';
import { paths } from '../../config/paths.js';
import { getLogger } from '../../logger/logger.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { Adresse } from '../entity/adresse.entity.js';
import { Werkstatt, WerkstattArt } from '../entity/werkstatt.entity.js';
import { Suchkriterien } from '../service/suchkriterien.js';
import { WerkstattReadService } from '../service/werkstatt-read.service.js';
import { getBaseUri } from './getBaseUri.js';

export type Link = {
    readonly href: string;
};

export type Links = {
    /** self-Link */
    readonly self: Link;
    /** Optionaler Linke für list */
    readonly list?: Link;
    /** Optionaler Linke für add */
    readonly add?: Link;
    /** Optionaler Linke für update */
    readonly update?: Link;
    /** Optionaler Linke für remove */
    readonly remove?: Link;
};

export type AdresseModel = Omit<Adresse, 'werkstatt' | 'id'>;

export type WerkstattModel = Omit<
    Werkstatt,
    'angestellte' | 'aktualisiert' | 'erzeugt' | 'id' | 'adresse' | 'version'
> & {
    adresse: AdresseModel;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    _links: Links;
};

export type WerkstaetteModel = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _embedded: {
        werkstaette: WerkstattModel[];
    };
};

export class WerksatattQuery implements Suchkriterien {
    @ApiProperty({ required: false })
    declare readonly name: string;

    @ApiProperty({ required: false })
    declare readonly rating: number;

    @ApiProperty({ required: false })
    declare readonly art: WerkstattArt;

    @ApiProperty({ required: false })
    declare readonly homepage: string;

    @ApiProperty({ required: false })
    declare readonly fertigbau: string;

    @ApiProperty({ required: false })
    declare readonly rohbau: string;

    @ApiProperty({ required: false })
    declare readonly adresse: string;
}

const APPLICATION_HAL_JSON = 'application/hal+json';

@Controller(paths.rest)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Werkstatt REST-API')
export class WerkstattGetController {
    readonly #service: WerkstattReadService;

    readonly #logger = getLogger(WerkstattGetController.name);

    constructor(service: WerkstattReadService) {
        this.#service = service;
    }

    // eslint-disable-next-line max-params
    @Get(':id')
    @Public()
    @ApiOperation({ summary: 'Sucher mit der Werkstatt-ID' })
    @ApiParam({
        name: 'id',
        description: 'Z.B. 1',
    })
    @ApiHeader({
        name: 'If-None-Match',
        description: 'Header für bedingte Get-Requests, zb "0"',
        required: false,
    })
    @ApiOkResponse({ description: 'Die Werkstatt wurde gefunden' })
    @ApiNotFoundResponse({ description: 'Keine Werkstatt zur ID gefunden' })
    @ApiResponse({
        status: HttpStatus.NOT_MODIFIED,
        description: 'Die Werkstatt wurde bereits heruntergeladen',
    })
    async getById(
        @Param('id') idStr: string,
        @Req() req: Request,
        @Headers('If-None-Match') version: string | undefined,
        @Res() res: Response,
    ): Promise<Response<WerkstattModel | undefined>> {
        this.#logger.debug('getById: idStr=%s, version=%s', idStr, version);
        const id = Number(idStr);
        if (!Number.isInteger(id)) {
            this.#logger.debug('getById: not isInteger()');
            throw new NotFoundException(
                `Die Werkstatt-ID ${id} ist nicht gültig`,
            );
        }

        if (req.accepts([APPLICATION_HAL_JSON, 'json', 'html']) === false) {
            this.#logger.debug('getById: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        const werkstatt = await this.#service.findById({ id });
        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug('getById(): werkstatt=%s', werkstatt.toString());
            this.#logger.debug('getById(): adresse=%o', werkstatt.adresse);
        }

        const versionDb = werkstatt.version;
        if (version === `"${versionDb}"`) {
            this.#logger.debug('getById: NOT_MODIFIED');
            return res.sendStatus(HttpStatus.NOT_MODIFIED);
        }

        this.#logger.debug('getById: versionDb=%s', versionDb);
        res.header('ETag', `"${versionDb}"`);

        const werkstattModel = this.#toModel(werkstatt, req);
        this.#logger.debug('getById: werkstattModel=%o', werkstattModel);
        return res.contentType(APPLICATION_HAL_JSON).json(werkstattModel);
    }

    @Get()
    @Public()
    @ApiOperation({ summary: 'Suche mit Suchkriteren' })
    @ApiResponse({ description: 'Eine eventuel leere Liste ' })
    async get(
        @Query() query: WerksatattQuery,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<Response<WerkstattModel | undefined>> {
        this.#logger.debug('get: query%o', query);

        if (req.accepts([APPLICATION_HAL_JSON, 'json', 'html']) === false) {
            this.#logger.debug('get accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        const werkstaette = await this.#service.find(query);
        this.#logger.debug('get %o', werkstaette);

        const werkstaetteModel: WerkstattModel[] = werkstaette.map(
            (werkstatt): WerkstattModel => this.#toModel(werkstatt, req, false),
        );
        this.#logger.debug('get werkstaetteModel=%o', werkstaetteModel);

        const result: WerkstaetteModel = {
            _embedded: { werkstaette: werkstaetteModel },
        };
        return res.contentType(APPLICATION_HAL_JSON).json(result).send();
    }

    #toModel(werkstatt: Werkstatt, req: Request, all = true) {
        const baseUri = getBaseUri(req);
        this.#logger.debug('#toModel: baseUri=%s', baseUri);
        const { id } = werkstatt;
        const links = all
            ? {
                  self: { href: `${baseUri}/${id}` },
                  list: { href: `${baseUri}` },
                  add: { href: `${baseUri}` },
                  update: { href: `${baseUri}/${id}` },
                  remove: { href: `${baseUri}/${id}` },
              }
            : { self: { href: `${baseUri}/${id}` } };

        this.#logger.debug(
            '#toModel: werkstatt=%o, links=%o',
            werkstatt,
            links,
        );
        const adresseModel: AdresseModel = {
            postleitzahl: werkstatt.adresse?.postleitzahl ?? 'N/A',
            strasse: werkstatt.adresse?.strasse ?? 'N/A',
            hausnummer: werkstatt.adresse?.hausnummer ?? 'N/A',
        };
        const werkstattModel: WerkstattModel = {
            werkstattname: werkstatt.werkstattname,
            rating: werkstatt.rating,
            art: werkstatt.art,
            homepage: werkstatt.homepage,
            schlagwoerter: werkstatt.schlagwoerter,
            adresse: adresseModel,
            _links: links,
        };

        return werkstattModel;
    }
}
