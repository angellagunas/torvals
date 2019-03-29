FROM grupoabraxas/nginx-spa:latest

LABEL  mantainer="alagunas@grupoabraxas.com"

RUN apk update && apk add --update bash
RUN apk add --no-cache --repository http://dl-cdn.alpinelinux.org/alpine/v3.7/main/ nodejs=8.9.3-r1

RUN mkdir /orax
ADD . /orax
WORKDIR /orax

RUN npm --prefix /orax/ install
RUN npm --prefix /orax/ run build

RUN rm -rf /usr/share/nginx/html
RUN mv /orax/build /usr/share/nginx/html
