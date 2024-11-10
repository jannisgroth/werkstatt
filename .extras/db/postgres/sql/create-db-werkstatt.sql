-- https://www.postgresql.org/docs/current/sql-createrole.html
CREATE ROLE werkstatt LOGIN PASSWORD 'p';

-- https://www.postgresql.org/docs/current/sql-createdatabase.html
CREATE DATABASE werkstatt;

GRANT ALL ON DATABASE werkstatt TO werkstatt;

-- https://www.postgresql.org/docs/10/sql-createtablespace.html
CREATE TABLESPACE werkstattspace OWNER werkstatt LOCATION '/var/lib/postgresql/tablespace/werkstatt';