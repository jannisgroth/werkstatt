CREATE SCHEMA IF NOT EXISTS AUTHORIZATION werkstatt;

ALTER ROLE werkstatt SET search_path = 'werkstatt';

CREATE TYPE werkstattart AS ENUM ('SCHREINEREI', 'MALEREI', 'ELEKTRONIKER');

CREATE TABLE IF NOT EXISTS werkstatt (

    id            integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE werkstattspace,
    version       integer NOT NULL DEFAULT 0,
    werkstattname text NOT NULL,
    rating        integer NOT NULL CHECK (rating >= 0 AND rating <= 5),
    art           werkstattart,
    homepage      text,
    schlagwoerter text,
    erzeugt       timestamp NOT NULL DEFAULT NOW(),
    aktualisiert  timestamp NOT NULL DEFAULT NOW()
) TABLESPACE werkstattspace;

CREATE TABLE IF NOT EXISTS adresse (
    id              integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE werkstattspace,
    postleitzahl    text NOT NULL,
    strasse         text,
    hausnummer      text,
    werkstatt_id    integer NOT NULL UNIQUE USING INDEX TABLESPACE werkstattspace REFERENCES werkstatt
) TABLESPACE werkstattspace;


CREATE TABLE IF NOT EXISTS angestellter (
    id              integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE werkstattspace,
    name            text NOT NULL,
    position        text,
    werkstatt_id    integer NOT NULL REFERENCES werkstatt
) TABLESPACE werkstattspace;
CREATE INDEX IF NOT EXISTS angestellter_werkstatt_id_idx ON angestellter(werkstatt_id) TABLESPACE werkstattspace;