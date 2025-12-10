# --- Stage 1: Build the React Frontend ---
FROM node:18 AS client-build
WORKDIR /app/client
COPY client/package*.json ./
# Install client dependencies
RUN npm install
COPY client/ ./
# Build the React app into static HTML/JS files
RUN npm run build

# --- Stage 2: Setup the Node Backend ---
FROM node:18
WORKDIR /app
COPY server/package*.json ./
# Install server dependencies
RUN npm install
COPY server/ ./

# --- Stage 3: Combine Them ---
# Copy the built React files from Stage 1 into the Server's public folder
COPY --from=client-build /app/client/build ./public

# Open the port the game runs on
EXPOSE 4000

# Start the game
CMD ["node", "server.js"]