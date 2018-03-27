FROM node:9

RUN apt-get update && apt-get install -y ruby-compass \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g bower grunt-cli

RUN mkdir /app && chown node:node /app

WORKDIR /app

USER node

COPY *.json ./

RUN npm install
RUN bower install

EXPOSE 9000

COPY page-templates ./page-templates/
COPY Gruntfile.js ./

CMD grunt serve
