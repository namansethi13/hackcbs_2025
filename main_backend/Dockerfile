# Dockerfile
# base
FROM node:18-alpine AS base
WORKDIR /app

# Only copy package files and install production dependencies
FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- Production Stage ----
# Start from a clean image and copy only what's needed
FROM node:18-alpine AS production
WORKDIR /app

# Copy production dependencies from 'dependencies' stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY src ./src

# Expose the port the app runs on (from .env)
EXPOSE 8000

# The command to run your application
CMD [ "node", "src/index.js" ]
