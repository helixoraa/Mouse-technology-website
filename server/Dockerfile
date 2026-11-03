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
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/server ./server
WORKDIR /app/server
EXPOSE 4000
# Syncs the schema, seeds missing content (idempotent) and starts the API.
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm run db:seed && node dist/index.js"]
