/* eslint-disable @eslint-community/eslint-comments/disable-enable-pair */
/* eslint-disable max-classes-per-file */

/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    ArrayUnique,
    IsArray,
    IsInt,
    IsOptional,
    IsUrl,
    Matches,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';
import { WerkstattArt } from '../entity/werkstatt.entity.js';
import { AdresseDTO } from './adresseDTO.entity.js';
import { AngestellterDTO } from './angestellterDTO.entity.js';

export const MAX_RATING = 5;

/**
 * Entity-Klasse für eine Werkstatt ohne TypeORM und ohne Referenzen.
 */
export class WerkstattDtoOhneRef {
    @ApiProperty({ example: 'Schreinerei Müller', type: String })
    readonly werkstattname!: string;

    @IsInt()
    @Min(0)
    @Max(MAX_RATING)
    @IsOptional()
    @ApiProperty({ example: 4, type: Number })
    readonly rating: number | undefined;

    @Matches(/^(SCHREINEREI|MALEREI|ELEKTRONIKER)$/u)
    @IsOptional()
    @ApiProperty({ example: 'Schreinerei', type: String })
    readonly art: WerkstattArt | undefined;

    @IsUrl()
    @IsOptional()
    @ApiProperty({ example: 'https://Etest.de/', type: String })
    readonly homepage: string | undefined;

    @IsOptional()
    @ArrayUnique()
    @ApiProperty({ example: ['FERTIGBAU', 'ROHBAU', 'INSTALLATION'] })
    readonly schlagwoerter: string[] | undefined;
}

/**
 * Entity-Klasse für eine Werkstatt ohne TypeORM.
 */
export class WerkstattDTO extends WerkstattDtoOhneRef {
    @ValidateNested()
    @Type(() => AdresseDTO)
    @ApiProperty({ type: AdresseDTO })
    readonly adresse!: AdresseDTO;

    @IsOptional()
    @IsArray()
    @ValidateNested()
    @Type(() => AngestellterDTO)
    @ApiProperty({ type: AngestellterDTO })
    readonly angestellte: AngestellterDTO[] | undefined;
}
