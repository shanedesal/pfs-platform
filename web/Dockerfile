FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Webpack in Docker: Turbopack's in-container memory growth hits Next's
# 80% heap threshold, restarts the dev server, and makes every route cold/slow.
CMD ["npm", "run", "dev", "--", "--webpack"]