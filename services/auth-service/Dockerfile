FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy service source code
COPY src ./src
COPY .sequelizerc ./

EXPOSE 3001

CMD ["node", "src/server.js"]
