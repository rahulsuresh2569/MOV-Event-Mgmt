FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy service source code
COPY src ./src

EXPOSE 3002

CMD ["node", "src/server.js"]
