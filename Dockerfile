FROM node:14.19-alpine

ENV NODE_ENV production
WORKDIR /usr/src
COPY app/ /usr/src/
RUN npm ci --only=production
USER node
CMD "npm" "start"