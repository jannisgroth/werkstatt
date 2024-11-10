import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KeycloakModule } from '../security/keycloak/keycloak.module.js';
import { WerkstattGetController } from './controller/werkstatt-get.controller.js';
import { WerkstattWriteController } from './controller/werkstatt-write.controller.js';
import { entities } from './entity/entities.js';
import { WerkstattMutationResolver } from './resolver/werkstatt-mutation.resolver.js';
import { WerkstattQueryResolver } from './resolver/werkstatt-query.resolver.js';
import { QueryBuilder } from './service/query-builder.js';
import { WerkstattReadService } from './service/werkstatt-read.service.js';
import { WerkstattWriteService } from './service/werkstatt-write.service.js';

@Module({
    imports: [KeycloakModule, TypeOrmModule.forFeature(entities)],
    controllers: [WerkstattGetController, WerkstattWriteController],

    providers: [
        WerkstattReadService,
        WerkstattWriteService,
        WerkstattQueryResolver,
        WerkstattMutationResolver,
        QueryBuilder,
    ],
    exports: [WerkstattReadService, WerkstattWriteService],
})
export class WerkstattModule {}
