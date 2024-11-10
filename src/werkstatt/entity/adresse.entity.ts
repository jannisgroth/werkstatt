import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Werkstatt } from './werkstatt.entity.js';

@Entity()
export class Adresse {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column('varchar')
    readonly postleitzahl!: string;

    @Column('varchar')
    readonly strasse: string | undefined;

    @Column('varchar')
    readonly hausnummer: string | undefined;

    @OneToOne(() => Werkstatt, (werkstatt) => werkstatt.adresse)
    @JoinColumn({ name: 'werkstatt_id' })
    werkstatt: Werkstatt | undefined;

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            postleitzahl: this.postleitzahl,
            strasse: this.strasse,
            hausnummer: this.hausnummer,
        });
}
