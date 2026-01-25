FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy service source code
COPY src ./src

# Expose port
EXPOSE 3003

# Start service
CMD ["npm", "start"]
