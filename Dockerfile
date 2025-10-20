# Build stage
# ---- Base setup shared by both ----
FROM node:20-alpine AS base
WORKDIR /app

# Install deps for all workspaces with caching
COPY package.json package-lock.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN npm ci --workspaces

# Copy source code 
COPY client ./client
COPY server ./server

# =====================================================
# ---- Production build (static) ----
FROM base AS build
RUN npm --workspace client run build \
 && rm -rf server/client-dist && mkdir -p server/client-dist \
 && cp -r client/dist/* server/client-dist/ \
 && npm --workspace server run build

# Prune dev deps across the tree 
RUN npm prune --omit=dev

# Runtime stage
FROM node:20-alpine AS production
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

# =====================================================
# ---- Client Development container (HMR) ----
FROM base AS client-development
WORKDIR /app/client
ENV NODE_ENV=development
EXPOSE 5173

ENV VITE_PORT=5173
ENV VITE_HOST=0.0.0.0
ENV CHOKIDAR_USEPOLLING=true
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]


# =====================================================
# ---- Server environment (Express * tsx watch)  ----
FROM base AS server-development
WORKDIR /app/server
ENV NODE_ENV=development
EXPOSE 8080
CMD ["npm", "run", "dev"]
