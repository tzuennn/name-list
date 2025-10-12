FROM node:18-alpine as test-stage

WORKDIR /app

# Copy test files and application code
COPY html/ html/
COPY tests/ tests/

# Install test dependencies if needed
# RUN npm install (if you had package.json)

FROM nginx:1.27.1-alpine

# Install Node.js for running tests in the final image
RUN apk add --no-cache nodejs

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY html/ /usr/share/nginx/html/

# Copy tests for running in container
COPY tests/ /app/tests/
COPY html/ /app/html/

WORKDIR /app
