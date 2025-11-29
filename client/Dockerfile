# --- BUILD STAGE ---
FROM node:20-alpine AS builder
WORKDIR /app

# copy package files
COPY package*.json ./

# install ALL deps, including devDependencies
RUN npm install

# copy everything
COPY . .

# build Next.js
RUN npm run build


# --- RUNTIME STAGE ---
FROM node:20-alpine
WORKDIR /app

# copy package files
COPY package*.json ./

# install ONLY production deps
RUN npm install --omit=dev

# copy build output
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/package.json ./package.json

ENV NODE_ENV=production
EXPOSE 3000

# start Next.js production server
CMD ["npm", "start"]