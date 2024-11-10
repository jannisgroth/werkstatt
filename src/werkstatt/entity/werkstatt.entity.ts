import { ApiProperty } from '@nestjs/swagger';
import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    VersionColumn,
} from 'typeorm';
import { dbType } from '../../config/db.js';
import { Adresse } from './adresse.entity.js';
import { Angestellter } from './angestellter.entity.js';

export type WerkstattArt = 'SCHREINEREI' | 'MALEREI' | 'ELEKTRONIKER';

@Entity()
export class Werkstatt {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @VersionColumn()
    readonly version: number | undefined;

    @Column('varchar')
    @ApiProperty({ example: 'Schreinerei Müller', type: String })
    readonly werkstattname!: string;

    @Column('int')
    @ApiProperty({ example: 5, type: Number })
    readonly rating: number | undefined;

    @Column('varchar')
    @ApiProperty({ example: 'Malerei', type: String })
    readonly art: WerkstattArt | undefined;

    @Column('varchar')
    @ApiProperty({ example: 'acme@müller.com', type: String })
    readonly homepage: string | undefined;

    @Column('simple-array')
    schlagwoerter: string[] | null | undefined;

    @OneToOne(() => Adresse, (adresse) => adresse.werkstatt, {
        cascade: ['insert', 'remove'],
    })
    readonly adresse: Adresse | undefined;

    @OneToMany(() => Angestellter, (angestellter) => angestellter.werkstatt, {
        cascade: ['insert', 'remove'],
    })
    readonly angestellte: Angestellter[] | undefined;

    @CreateDateColumn({
        type: dbType === 'sqlite' ? 'datetime' : 'timestamp',
    })
    readonly erzeugt: Date | undefined;

    @UpdateDateColumn({
        type: dbType === 'sqlite' ? 'datetime' : 'timestamp',
    })
    readonly aktualisiert: Date | undefined;

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            version: this.version,
            werkstattname: this.werkstattname,
            rating: this.rating,
            art: this.art,
            homepage: this.homepage,
            schlagwoerter: this.schlagwoerter,
            erzeugt: this.erzeugt,
            aktualisiert: this.aktualisiert,
        });
}
