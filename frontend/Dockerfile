FROM node:18-alpine

# Create working directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy ALL other files
COPY . .

# Build the app
RUN npm run build

# Serve the app
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "build"]