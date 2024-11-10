/* eslint-disable @eslint-community/eslint-comments/disable-enable-pair */
/* eslint-disable max-classes-per-file */
import { HttpException, HttpStatus } from '@nestjs/common';
import { HttpStatusCode } from 'axios';

export class VersionInvalidException extends HttpException {
    constructor(readonly version: string | undefined) {
        super(
            `Die Versionsnummer ${version} ist invalide.`,
            HttpStatusCode.PreconditionFailed,
        );
    }
}

export class VersionOutdatedException extends HttpException {
    constructor(readonly version: number) {
        super(
            `Die Versionsnummer ${version} ist nicht aktuell.`,
            HttpStatus.PRECONDITION_FAILED,
        );
    }
}

export class NameExistsException extends HttpException {
    constructor(readonly werkstattname: string) {
        super(
            `Die Werkstatt mit dem Name ${werkstattname} existiert bereits.`,
            HttpStatus.UNPROCESSABLE_ENTITY,
        );
    }
}
