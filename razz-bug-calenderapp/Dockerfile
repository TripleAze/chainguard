# ============================================
# Stage 1: Build
# ============================================
FROM node:22-alpine AS build

RUN apk upgrade --no-cache

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ============================================
# Stage 2: Production  ← this is what runs in prod
# ============================================
FROM cgr.dev/chainguard/nginx:latest AS production

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]