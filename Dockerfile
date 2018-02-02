FROM node:8.7.0

ENV NODE_ENV production
RUN npm config set -g production false

# Install dependencies.
ADD package.json /tmp/package.json
RUN cd /tmp && npm --unsafe-perm install
RUN mkdir -p /app && cp -a /tmp/node_modules /app/

# Copy application code.
ADD . /app
WORKDIR /app

RUN make app-dist
RUN make admin-dist

ENV NODE_ENV="production"

# Run tracker
CMD npm run start