FROM node:boron-slim
LABEL maintainer Mofesola Babalola <me@mofesola.com>

#Get required applications
ENV DEBIAN_FRONTEND noninteractive

#Create App Directory
WORKDIR /usr/src/app

#Install Dependencies
COPY package.json /usr/src/app
RUN npm install
RUN apt-get update && apt-get install -y vim nano

COPY . /usr/src/app
COPY conf/entrypoint.sh .
#Setup the DB with initial user
RUN chmod +x conf/initcouch.sh entrypoint.sh
COPY config-example.js config.js

EXPOSE 3000

ENTRYPOINT ./entrypoint.sh
