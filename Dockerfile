FROM node:14.19-alpine
RUN apk add dumb-init
ENV NODE_ENV production
WORKDIR /usr/src
COPY --chown=node:node app/ /usr/src/
RUN npm ci --only=production
USER node
CMD ["dumb-init", "node", "app.js"]