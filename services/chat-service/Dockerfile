# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY src ./src
COPY public ./public

# Expose port
EXPOSE 3004

# Start the service
CMD ["npm", "start"]
