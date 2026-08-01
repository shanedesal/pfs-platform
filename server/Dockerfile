FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["sh", "-c", "npm install && npx prisma generate && npx prisma migrate deploy && if [ \"$SEED_DB\" = \"true\" ]; then npx prisma db seed; fi && npm run dev"]