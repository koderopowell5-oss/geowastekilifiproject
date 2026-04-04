FROM node:18-alpine

WORKDIR /app

# Copy backend source
COPY backend ./backend
COPY types.ts ./

# Install dependencies
WORKDIR /app/backend
RUN npm install && npm run build

EXPOSE 5000

CMD ["npm", "start"]
