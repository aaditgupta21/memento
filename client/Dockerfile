# --- BUILD STAGE ---
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (including devDependencies needed for build)
RUN npm install

# Copy application code
COPY . .

# Build the application
RUN npm run build

# --- RUNTIME STAGE ---
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
ENV NODE_ENV=production

CMD ["npm", "start"]