FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with verbose logging
RUN npm install --legacy-peer-deps --verbose

# Copy the rest of the app
COPY . ./

# Run build with increased verbosity
RUN npm run build --verbose

# Production stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
# Default nginx config will work fine

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]