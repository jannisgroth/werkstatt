import { type WerkstattArt } from '../entity/werkstatt.entity.js';

export type Suchkriterien = {
    readonly name?: string;
    readonly rating?: number;
    readonly art?: WerkstattArt;
    readonly homepage?: string;
    readonly fertigbau?: string;
    readonly rohbau?: string;
    readonly installation?: string;
    readonly adresse?: string;
};
