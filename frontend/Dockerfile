FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN CI=false npm run build
# Debug - list contents to verify build succeeded
RUN ls -la build/

FROM nginx:alpine
# Copy the build output to replace the default nginx contents
COPY --from=build /app/build /usr/share/nginx/html

# Direct modification of the default config to listen on PORT env variable
RUN sed -i.bak 's/listen\(.*\)80;/listen $PORT;/' /etc/nginx/conf.d/default.conf && \
    sed -i.bak 's/^user *nginx;/#user nginx;/' /etc/nginx/nginx.conf

# Make sure we can replace PORT at runtime
CMD ["sh", "-c", "sed -i \"s/\\$PORT/$PORT/g\" /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]