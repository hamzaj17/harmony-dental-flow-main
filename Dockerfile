FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 DATABASE_PATH=/app/.data/clinic.sqlite
COPY --from=build --chown=node:node /app/.output ./.output
COPY --from=build --chown=node:node /app/server ./server
COPY --from=build --chown=node:node /app/scripts ./scripts
RUN mkdir -p /app/.data && chown node:node /app/.data
USER node
EXPOSE 3000
CMD ["node", "scripts/production.mjs"]
