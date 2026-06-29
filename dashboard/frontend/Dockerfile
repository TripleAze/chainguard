# Build stage
FROM cgr.dev/chainguard/node:latest as builder

# Accept build arg and set it as env
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Copy package.json and package-lock.json first
COPY --chown=node:node package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the code
COPY --chown=node:node . .

# Build the Next.js app
RUN npm run build

# Production stage
FROM cgr.dev/chainguard/node:latest

# Copy necessary files from builder
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# Set environment to production
ENV NODE_ENV production

# Expose port 3000
EXPOSE 3000

# Start the Next.js server
CMD ["node", "server.js"]
