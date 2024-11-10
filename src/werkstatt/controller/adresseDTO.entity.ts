/* eslint-disable @eslint-community/eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/no-magic-numbers */

/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */
import { ApiProperty } from '@nestjs/swagger';
import { Matches, MaxLength } from 'class-validator';

export class AdresseDTO {
    @Matches(/^\d{5}$/u)
    @MaxLength(5)
    @ApiProperty({ example: '76227', type: String })
    readonly postleitzahl!: string;

    @Matches(/^[\p{L}\s\-']+$/iu)
    @MaxLength(30)
    @ApiProperty({ example: 'Mozartstraße', type: String })
    readonly strasse: string | undefined;

    @Matches(/^\d{1,2}[A-Za-z]?$/u)
    @MaxLength(4)
    @ApiProperty({ example: '12A', type: String })
    readonly hausnummer: string | undefined;
}
