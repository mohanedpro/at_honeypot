FROM node:18-slim

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production

COPY . .

RUN mkdir -p logs

EXPOSE 3000

CMD [ "node", "server.js" ]