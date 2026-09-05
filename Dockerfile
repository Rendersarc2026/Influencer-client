# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

# Copy dependency manifests
COPY package.json package-lock.json .npmrc ./

# Install dependencies deterministically
RUN npm ci

# Copy application source
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Serve with Caddy
FROM caddy:2-alpine

# Copy custom Caddy configuration
COPY Caddyfile /etc/caddy/Caddyfile

# Copy build artifacts
COPY --from=builder /app/dist /usr/share/caddy

EXPOSE 80

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
