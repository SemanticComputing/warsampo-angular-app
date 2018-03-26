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

With Docker Compose:

`docker-compose up` (or `docker-compose up client` for just this frontend)

Without Docker:

`grunt serve`

The server url can be set with the environment variable `WARSAMPO_SERVER_URL`,
e.g. `WARSAMPO_SERVER_URL=http://localhost:8080 grunt serve`.

## Build

With Docker Compose:

`docker-compose run client grunt build`

Without Docker:

`grunt build`

The server url can be set with the environment variable `WARSAMPO_SERVER_URL`,
e.g. `WARSAMPO_SERVER_URL=http://example.com grunt build`.
