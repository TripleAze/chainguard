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
FROM nginx:1.27-alpine AS production

# Upgrade OS packages in the stage that actually ships
# This fixes: libxml2, libcrypto3, libssl3
RUN apk upgrade --no-cache

# Remove default nginx static content
RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]