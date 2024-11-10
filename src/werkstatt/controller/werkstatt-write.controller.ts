import {
    Body,
    Controller,
    Delete,
    Headers,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Put,
    Req,
    Res,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiHeader,
    ApiNoContentResponse,
    ApiOperation,
    ApiPreconditionFailedResponse,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthGuard, Roles } from 'nest-keycloak-connect';
import { paths } from '../../config/paths.js';
import { getLogger } from '../../logger/logger.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { type Adresse } from '../entity/adresse.entity.js';
import { type Angestellter } from '../entity/angestellter.entity.js';
import { type Werkstatt } from '../entity/werkstatt.entity.js';
import { WerkstattWriteService } from '../service/werkstatt-write.service.js';
import { getBaseUri } from './getBaseUri.js';
import { WerkstattGetController } from './werkstatt-get.controller.js';
import { WerkstattDTO, WerkstattDtoOhneRef } from './werkstattDTO.entity.js';

const MSG_FORBIDDEN = 'Kein Token mit ausreichender Berechtigung vorhanden';

@Controller(paths.rest)
@UseGuards(AuthGuard)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Werkstatt REST_API')
@ApiBearerAuth()
export class WerkstattWriteController {
    readonly #service: WerkstattWriteService;
    readonly #logger = getLogger(WerkstattGetController.name);

    constructor(service: WerkstattWriteService) {
        this.#service = service;
    }

    @Post()
    @Roles({ roles: ['admin', 'user'] })
    @ApiOperation({ summary: 'Eine neue Werkstatt anlegen' })
    @ApiCreatedResponse({ description: 'Erfolgreich neu angelegt' })
    @ApiBadRequestResponse({ description: 'Fehlerhafte Werkstattdaten' })
    @ApiForbiddenResponse({ description: MSG_FORBIDDEN })
    async post(
        @Body() werkstattDTO: WerkstattDTO,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<Response> {
        this.#logger.debug('post: werkstattDTO=%o', werkstattDTO);

        const werkstatt = this.#werkstattDtoToWerkstatt(werkstattDTO);
        const id = await this.#service.create(werkstatt);

        const location = `${getBaseUri(req)}/${id}`;
        this.#logger.debug('post: location=%s', location);
        return res.location(location).send();
    }

    // eslint-disable-next-line max-params
    @Put(':id')
    @Roles({ roles: ['admin', 'user'] })
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Eine vorhandene Werkstatt aktualisieren',
        tags: ['Aktualisieren'],
    })
    @ApiHeader({
        name: 'If-Match',
        description: 'Header für die optimistische Synchronisierung',
        required: false,
    })
    @ApiNoContentResponse({ description: 'Erfolgreich aktualisiert' })
    @ApiBadRequestResponse({ description: 'Fehlerhafte Werkstattdaten' })
    @ApiPreconditionFailedResponse({
        description: 'Falsche Version im Header "If-Match"',
    })
    @ApiResponse({
        status: HttpStatus.PRECONDITION_REQUIRED,
        description: 'Header "If-Match" fehlt',
    })
    @ApiForbiddenResponse({ description: MSG_FORBIDDEN })
    async put(
        @Body() werkstattDTO: WerkstattDtoOhneRef,
        @Param('id') id: number,
        @Headers('If-Match') version: string | undefined,
        @Res() res: Response,
    ): Promise<Response> {
        this.#logger.debug(
            'put: id=%s, werkstattDTO=%o, version=%s',
            id,
            werkstattDTO,
            version,
        );
        if (version === undefined) {
            const msg = 'Header "If-Match" fehlt';
            this.#logger.debug('put: msg=%s', msg);
            return res
                .status(HttpStatus.PRECONDITION_FAILED)
                .set('Content-Type', 'application/json')
                .send(msg);
        }

        const werkstatt = this.#werkstattDtoOhneRefToWerkstatt(werkstattDTO);
        const neueVersion = await this.#service.update({
            id,
            werkstatt,
            version,
        });
        this.#logger.debug('put: version=%s', neueVersion);
        return res.header('ETag', `"${neueVersion}"`).send();
    }

    @Delete(':id')
    @Roles({ roles: ['admin'] })
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Die Werkstatt mit der ID löschen ' })
    @ApiNoContentResponse({
        description: 'Die Werkstatt wurde gelöscht oder war nicht vorhanden',
    })
    @ApiForbiddenResponse({ description: MSG_FORBIDDEN })
    async delete(@Param('id') id: number) {
        this.#logger.debug('delete: id=%s', id);
        await this.#service.delete(id);
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
        const werkstatt = {
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

        werkstatt.adresse.werkstatt = werkstatt;
        werkstatt.angestellte?.forEach((angestellter) => {
            angestellter.werkstatt = werkstatt;
        });
        return werkstatt;
    }

    #werkstattDtoOhneRefToWerkstatt(
        werkstattDTO: WerkstattDtoOhneRef,
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
