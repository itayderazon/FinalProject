# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Build arguments for environment variables
ARG VITE_API_URL=http://localhost:3001/api
ARG VITE_SERVER_URL=http://localhost:3001
ARG VITE_PYTHON_API_URL=http://localhost:8000/api

# Set environment variables for build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SERVER_URL=$VITE_SERVER_URL
ENV VITE_PYTHON_API_URL=$VITE_PYTHON_API_URL

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 