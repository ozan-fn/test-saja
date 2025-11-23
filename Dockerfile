FROM node:22-alpine3.19

# Install Chromium and necessary dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    dbus \
    alsa-lib

# Set Puppeteer to skip downloading Chromium and use the installed one
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install -g pnpm && pnpm install

# Copy source code
COPY . .

# Set environment variables
ENV HEADLESS=true

# Create tmp directory
RUN mkdir -p /app/tmp

# Expose port
EXPOSE 3000

# Run the app
CMD ["pnpm", "start"]