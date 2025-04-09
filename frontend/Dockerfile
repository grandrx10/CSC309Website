# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN CI=false npm run build
# Debug - list contents to verify build succeeded
RUN ls -la build/

# Runtime stage
FROM nginx:alpine

# Copy the build output from the build stage
COPY --from=build /app/build /usr/share/nginx/html

# Modify Nginx config to listen on PORT environment variable
RUN sed -i 's/listen 80;/listen $PORT;/' /etc/nginx/conf.d/default.conf && \
    sed -i 's/^user nginx;/#user nginx;/' /etc/nginx/nginx.conf

# Make sure PORT variable is replaced dynamically at runtime
CMD ["sh", "-c", "envsubst '$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
