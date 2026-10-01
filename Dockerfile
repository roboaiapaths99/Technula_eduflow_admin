# Multi-stage Docker build for Technula EduFlow Frontend
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build production bundle
COPY . .
ARG VITE_API_BASE=""
ENV VITE_API_BASE=$VITE_API_BASE
RUN npm run build

# Production web server stage
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built production assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
