FROM grupoabraxas/nginx-spa:latest

LABEL  mantainer="alagunas@grupoabraxas.com"

RUN apk update && apk add --update nodejs

RUN mkdir /orax
ADD . /orax
WORKDIR /orax

RUN rm -rf /usr/share/nginx/html
RUN mv /orax/build /usr/share/nginx/html
