# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy necessary files
COPY frontend . 
COPY types.ts ./

# Install dependencies and build
RUN npm install && npm run build

# Production stage
FROM nginx:alpine

# Copy built app to nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
