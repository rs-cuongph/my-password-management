# Multi-stage build for React frontend
FROM node:20-alpine AS development

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port for development server
EXPOSE 3000

# Development command with hot reload
CMD ["npm", "start"]

# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=build /app/build /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S reactapp -u 1001

# Set ownership
RUN chown -R reactapp:nodejs /usr/share/nginx/html && \
    chown -R reactapp:nodejs /var/cache/nginx && \
    chown -R reactapp:nodejs /var/log/nginx && \
    chown -R reactapp:nodejs /etc/nginx/conf.d

# Create temp directories for nginx
RUN touch /var/run/nginx.pid && \
    chown -R reactapp:nodejs /var/run/nginx.pid

# Switch to non-root user
USER reactapp

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]