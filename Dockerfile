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

# Stage 2: Serve with nginx
FROM nginx:alpine

# Replace the default site; the headers snippet sits outside conf.d because
# every file there is loaded into the http context.
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf

# Copy build artifacts
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
