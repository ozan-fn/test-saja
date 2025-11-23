FROM timbru31/node-chrome:jod

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY package.json ./

RUN yarn install

COPY . .

ENV HEADLESS=true

RUN mkdir -p /app/tmp

EXPOSE 3000

CMD ["yarn", "start"]