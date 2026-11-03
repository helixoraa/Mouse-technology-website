# Build context: repository root (docker compose sets this).
FROM node:22-slim AS base
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci -w server --include-workspace-root

FROM deps AS build
COPY server ./server
RUN npm run build -w server

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server ./server
# The seed registers the client-bundled animations in the Media library (it reads ../../client/public/animations).
COPY client/public/animations /app/client/public/animations
WORKDIR /app/server
EXPOSE 4000
# Checks secrets, syncs the schema, seeds missing content (idempotent) and starts the API.
ENTRYPOINT ["sh", "/app/server/docker-entrypoint.sh"]
