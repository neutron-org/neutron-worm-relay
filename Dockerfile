FROM node:21-alpine
WORKDIR /usr/app
RUN apk add --no-cache python3 make g++
COPY package.json .
RUN npm install
COPY . .