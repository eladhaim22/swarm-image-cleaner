FROM node:lts-alpine3.9 as build

WORKDIR /build
COPY . /build/
RUN npm install
RUN npm run buildProd

FROM node:lts-alpine3.9 as server
RUN apk add tzdata
WORKDIR /server
COPY --from=build /build/dist/server.js /build/package.json ./

CMD npm run start-docker