FROM node:14.19-alpine

WORKDIR /usr/src
COPY app/ /usr/src/
RUN npm install --production
CMD npm run start