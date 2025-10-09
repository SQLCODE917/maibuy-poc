# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Install deps for all workspaces with caching
COPY package.json package-lock.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN npm ci --workspaces

# Build client and server 
COPY client ./client
COPY server ./server

RUN npm --workspace client run build \
 && rm -rf server/client-dist && mkdir -p server/client-dist \
 && cp -r client/dist/* server/client-dist/ \
 && npm --workspace server run build

# Prune dev deps across the tree 
RUN npm prune --omit=dev

# Runtime stage
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# 1) Root manifests for the workspace graph
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json

# 2) Server manifest so Node sees "type":"module" at /app/server/
COPY --from=build /app/server/package.json ./server/package.json

# 3) Install only server prod deps
RUN npm ci --omit=dev --workspace=server

# 4) App code and static assets
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/client-dist ./client-dist

USER node
EXPOSE 8080
CMD ["node", "server/dist/index.js"]
