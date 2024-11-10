import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type DeleteResult, Repository } from 'typeorm';
import { getLogger } from '../../logger/logger.js';
import { Adresse } from '../entity/adresse.entity.js';
import { Angestellter } from '../entity/angestellter.entity.js';
import { Werkstatt } from '../entity/werkstatt.entity.js';
import {
    NameExistsException,
    VersionInvalidException,
    VersionOutdatedException,
} from './exeptions.js';
import { WerkstattReadService } from './werkstatt-read.service.js';

export type UpdateParams = {
    readonly id: number | undefined;
    readonly werkstatt: Werkstatt;
    readonly version: string;
};

@Injectable()
export class WerkstattWriteService {
    private static readonly VERSION_PATTERN = /^"\d{1,3}"/u;

    readonly #repo: Repository<Werkstatt>;

    readonly #readService: WerkstattReadService;

    readonly #logger = getLogger(WerkstattWriteService.name);

    constructor(
        @InjectRepository(Werkstatt) repo: Repository<Werkstatt>,
        readService: WerkstattReadService,
    ) {
        this.#repo = repo;
        this.#readService = readService;
    }

    async create(werkstatt: Werkstatt): Promise<number> {
        this.#logger.debug('create: werkstatt=%o', werkstatt);
        await this.#validateCreate(werkstatt);

        const werkstattDb = await this.#repo.save(werkstatt);
        this.#logger.debug('create: werkstattDb=%o', werkstattDb);

        return werkstattDb.id!;
    }

    async update({ id, werkstatt, version }: UpdateParams): Promise<number> {
        this.#logger.debug(
            'update: id=%d, werkstatt=%o, version=%s',
            id,
            werkstatt,
            version,
        );
        if (id === undefined) {
            this.#logger.debug('update: Keine gueltige ID');
            throw new NotFoundException(
                `es gibt keine Werkstatt mit der id ${id}.`,
            );
        }

        const validateResult = await this.#validateUpdate(
            werkstatt,
            id,
            version,
        );
        this.#logger.debug('update: validateResult=%o', validateResult);
        if (!(validateResult instanceof Werkstatt)) {
            return validateResult;
        }

        const werkstattNeu = validateResult;
        const merged = this.#repo.merge(werkstattNeu, werkstatt);
        this.#logger.debug('update: merged=%o', merged);
        const updated = await this.#repo.save(merged);
        this.#logger.debug('update: update=%o', updated);

        return updated.version!;
    }

    async delete(id: number) {
        this.#logger.debug('delete: id=%d', id);
        const werkstatt = await this.#readService.findById({
            id,
            mitAngestellten: true,
        });

        let deleteResult: DeleteResult | undefined;
        await this.#repo.manager.transaction(async (transactionalMgr) => {
            const adresseId = werkstatt.adresse?.id;
            if (adresseId !== undefined) {
                await transactionalMgr.delete(Adresse, adresseId);
            }

            const angestellte = werkstatt.angestellte ?? [];
            for (const angestellter of angestellte) {
                await transactionalMgr.delete(Angestellter, angestellter.id);
            }

            deleteResult = await transactionalMgr.delete(Werkstatt, id);
            this.#logger.debug('delete: deleteResult=%o', deleteResult);
        });

        return (
            deleteResult?.affected !== undefined &&
            deleteResult.affected !== null &&
            deleteResult.affected > 0
        );
    }

    async #validateCreate({ werkstattname }: Werkstatt): Promise<undefined> {
        this.#logger.debug('#validateCreate: name%s', werkstattname);
        if (await this.#repo.existsBy({ werkstattname })) {
            throw new NameExistsException(werkstattname);
        }
    }

    async #validateUpdate(
        werkstatt: Werkstatt,
        id: number,
        versionStr: string,
    ): Promise<Werkstatt> {
        this.#logger.debug(
            '#validateUpdate: werkstatt=%o, id=%s, versionStr=%s',
            werkstatt,
            id,
            versionStr,
        );
        if (!WerkstattWriteService.VERSION_PATTERN.test(versionStr)) {
            throw new VersionInvalidException(versionStr);
        }

        const version = Number.parseInt(versionStr.slice(1, -1), 10);
        this.#logger.debug(
            '#validateUpdate: werkstatt=%o, version=%d',
            werkstatt,
            version,
        );

        const werkstattDb = await this.#readService.findById({ id });

        const versionDb = werkstattDb.version!;
        if (version < versionDb) {
            this.#logger.debug('#validateUpdate: versionDb=%d', version);
            throw new VersionOutdatedException(version);
        }
        this.#logger.debug('#validateUpdate: werkstattDb=%o', werkstattDb);
        return werkstattDb;
    }
}
