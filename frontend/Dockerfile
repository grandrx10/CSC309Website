FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN CI=false npm run build

FROM nginx:alpine
# Copy the build output to replace the default nginx contents
COPY --from=build /app/build /usr/share/nginx/html

# Create templates directory
RUN mkdir -p /etc/nginx/templates

# Create a simple nginx config that handles the PORT environment variable
RUN echo 'server {\n\
    listen ${PORT:-80};\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html;\n\
        try_files $uri $uri/ /index.html =404;\n\
    }\n\
}' > /etc/nginx/templates/default.conf.template

CMD ["sh", "-c", "envsubst < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]