# Singular/ty Command Hub — self-host image.
# Multi-stage: install+build, then a lean runtime. Serves on port 3100.
#
# Build:  docker build -t command-hub .
# Run:    docker run -p 3100:3100 --env-file .env.local command-hub
# Compose: docker compose up -d --build   (see docker-compose.yml)

FROM node:22-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3100 \
    HOSTNAME=0.0.0.0
# Copy the built app + deps (no standalone output configured, so ship node_modules).
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.mjs ./next.config.mjs
# Local-first stores live under these (mount as volumes to persist).
RUN mkdir -p data local-data && \
    useradd -m hub && chown -R hub:hub /app
USER hub
EXPOSE 3100
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3100/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3100"]
