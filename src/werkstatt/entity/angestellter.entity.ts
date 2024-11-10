import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

import { Werkstatt } from './werkstatt.entity.js';

@Entity()
export class Angestellter {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column('varchar')
    readonly name!: string;

    @Column('varchar')
    readonly position: string | undefined;

    @ManyToOne(() => Werkstatt, (werkstatt) => werkstatt.angestellte)
    @JoinColumn({ name: 'werkstatt_id' })
    werkstatt: Werkstatt | undefined;

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            name: this.name,
            position: this.position,
        });
}
