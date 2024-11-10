// eslint-disable-next-line @eslint-community/eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/no-magic-numbers */

/**
 * Das Modul besteht aus der Entity Klasse.
 * @packageDocumentation
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, Matches, MaxLength } from 'class-validator';

/**
 * Entity-Klasse für Angestelle ohne TypeORM.
 */
export class AngestellterDTO {
    @Matches(/^[\sa-zßäöü-]+$/iu)
    @MaxLength(30)
    @ApiProperty({ example: 'Der Name', type: String })
    readonly name!: string;

    @IsOptional()
    @MaxLength(20)
    @ApiProperty({ example: 'Projektleiter', type: String })
    readonly position: string | undefined;
}
