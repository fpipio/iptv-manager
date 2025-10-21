# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source and build
COPY frontend/ ./
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

# Install sqlite3 for database debugging
RUN apk add --no-cache sqlite

# Copy backend package files
COPY backend/package*.json ./
RUN npm install --omit=dev

# Copy backend source
COPY backend/ ./

# Copy frontend build to public directory
COPY --from=frontend-builder /app/frontend/dist ./public

# Copy EPG grabber (critical for EPG functionality)
COPY epg-grabber/ ./epg-grabber/

# Install EPG grabber dependencies
WORKDIR /app/epg-grabber
RUN npm install --omit=dev

# Back to app root
WORKDIR /app

# Create data directory
RUN mkdir -p /app/data/output /app/data/epg

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "src/server.js"]
