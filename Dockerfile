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

# Set DNS to Google for better connectivity
RUN echo 'nameserver 8.8.8.8' > /etc/resolv.conf

# Install dependencies
RUN npm install -g yarn && yarn install

# Copy source code
COPY . .

# Set environment variables
ENV HEADLESS=true

# Create tmp directory
RUN mkdir -p /app/tmp

# Expose port
EXPOSE 3000

# Run the app
CMD ["yarn", "start"]