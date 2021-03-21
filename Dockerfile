FROM node:latest


WORKDIR /fargate-chron-server
COPY . /fargate-chron-server

COPY package.json .
RUN npm install

ENTRYPOINT ["node"]
CMD ["cron.js"]