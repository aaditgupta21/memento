FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Expose port
EXPOSE 4000

# Start the server in production mode
CMD ["npm", "start"]

