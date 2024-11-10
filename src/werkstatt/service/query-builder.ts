/* eslint-disable @eslint-community/eslint-comments/disable-enable-pair */
/* eslint-disable max-lines-per-function */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { getLogger } from '../../logger/logger.js';
import { Adresse } from '../entity/adresse.entity.js';
import { Angestellter } from '../entity/angestellter.entity.js';
import { Werkstatt } from '../entity/werkstatt.entity.js';
import { Suchkriterien } from './suchkriterien.js';

export type BuildIdParams = {
    readonly id: number;

    readonly mitAngestellten?: boolean;
};

@Injectable()
export class QueryBuilder {
    readonly #werkstattAlias = `${Werkstatt.name
        .charAt(0)
        .toLowerCase()}${Werkstatt.name.slice(1)}`;

    readonly #adresseAlias = `${Adresse.name
        .charAt(0)
        .toLowerCase()}${Adresse.name.slice(1)}}`;

    readonly #angestellterAlias = `${Angestellter.name
        .charAt(0)
        .toLowerCase()}${Angestellter.name.slice(1)}}`;

    readonly #repo: Repository<Werkstatt>;

    readonly #logger = getLogger(QueryBuilder.name);

    constructor(@InjectRepository(Werkstatt) repo: Repository<Werkstatt>) {
        this.#repo = repo;
    }

    buildId({
        id,
        mitAngestellten = false,
    }: BuildIdParams): SelectQueryBuilder<Werkstatt> {
        const queryBuilder = this.#repo.createQueryBuilder(
            this.#werkstattAlias,
        );

        queryBuilder.innerJoinAndSelect(
            `${this.#werkstattAlias}.adresse`,
            this.#adresseAlias,
        );

        if (mitAngestellten) {
            queryBuilder.leftJoinAndSelect(
                `${this.#werkstattAlias}.angestellte`,
                this.#angestellterAlias,
            );
        }

        queryBuilder.where(`${this.#werkstattAlias}.id = :id`, { id: id }); // eslint-disable-line object-shorthand
        return queryBuilder;
    }

    build({
        adresse,
        fertigbau,
        rohbau,
        installation,
        ...props
    }: Suchkriterien) {
        this.#logger.debug(
            'build: adresse%s, fertigbau%s, rohbau%s, installation%s, props%s',
            adresse,
            fertigbau,
            rohbau,
            installation,
            props,
        );

        let queryBuilder = this.#repo.createQueryBuilder(this.#werkstattAlias);
        queryBuilder.innerJoinAndSelect(
            `${this.#werkstattAlias}.adresse`,
            'adresse',
        );

        let useWhere = true;

        if (adresse !== undefined && typeof adresse === 'string') {
            const ilike = 'ilike';
            queryBuilder = queryBuilder.where(
                `${this.#adresseAlias}.adresse ${ilike} :adresse`,
                { adresse: `%${adresse}%` },
            );
            useWhere = false;
        }

        if (fertigbau === 'true') {
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#werkstattAlias}.schlagwoerter like '%FERTIGBAU%'`,
                  )
                : queryBuilder.andWhere(
                      `${this.#werkstattAlias}.schlagwoerter like '%FERTIGBAU%'`,
                  );
            useWhere = false;
        }

        if (rohbau === 'true') {
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#werkstattAlias}.schlagwoerter like '%ROHBAU%'`,
                  )
                : queryBuilder.andWhere(
                      `${this.#werkstattAlias}.schlagwoerter like '%ROHBAU%'`,
                  );
            useWhere = false;
        }

        if (installation === 'true') {
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#werkstattAlias}.schlagwoerter like '%INSTALLATION%'`,
                  )
                : queryBuilder.andWhere(
                      `${this.#werkstattAlias}.schlagwoerter like '%INSTALLATION%'`,
                  );
            useWhere = false;
        }

        Object.keys(props).forEach((key) => {
            const param: Record<string, any> = {};
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, security/detect-object-injection
            param[key] = (props as Record<string, any>)[key];
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#werkstattAlias}.${key} = :${key}`,
                      param,
                  )
                : queryBuilder.andWhere(
                      `${this.#werkstattAlias}.${key} = :${key}`,
                      param,
                  );
            useWhere = false;
        });

        this.#logger.debug('build: sql=%s', queryBuilder.getSql());
        return queryBuilder;
    }
}
