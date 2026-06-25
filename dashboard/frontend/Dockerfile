# Build stage
FROM cgr.dev/chainguard/node:latest as builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the code
COPY . .

# Build the Next.js app
RUN npm run build

# Production stage
FROM cgr.dev/chainguard/node:latest

# Set working directory
WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set environment to production
ENV NODE_ENV production

# Expose port 3000
EXPOSE 3000

# Start the Next.js server
CMD ["node", "server.js"]
