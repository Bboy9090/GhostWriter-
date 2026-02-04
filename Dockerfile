FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
RUN npm run build

FROM pierrezemb/gostatic@sha256:7e5718f98f2172f7c8dffd152ef0b203873ba889c8d838b2e730484fc71f6acd
COPY --from=build /app/dist/ /srv/http/
CMD ["-port","8080","-https-promote", "-enable-logging"]
