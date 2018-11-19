# WarSampo

Events, persons, military units, photographs, cemeteries

## Requirements

Docker (and Docker Compose), or:

    sudo apt-get install ruby-compass
    sudo gem install compass
    npm install
    npm install -g grunt-cli
    bower install

## Development

### With Docker Compose

Frontend only: `docker-compose -f docker-compose.yml -f docker-compose.development.yml up -d client`
With Fuseki images (warsa, pnr, history): `docker-compose -f docker-compose.yml -f docker-compose.development.yml up -d`

### Without Docker

`grunt serve`

The SPARQL endpoint URL can be set with the environment variable `WARSAMPO_ENDPOINT_URL`,
e.g. `WARSAMPO_ENDPOINT_URL=http://localhost:8080 grunt serve`.

## Build

With Docker Compose:

`docker-compose run client grunt build`

Without Docker:

`grunt build`

The SPARQL endpoint URL can be set with the environment variable `WARSAMPO_ENDPOINT_URL`,
e.g. `WARSAMPO_ENDPOINT_URL=http://example.com grunt build`.
