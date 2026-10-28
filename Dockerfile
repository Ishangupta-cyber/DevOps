FROM node:22-alpine

WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
RUN npm install --omit=dev

COPY apps/api ./apps/api
COPY apps/web ./apps/web
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]


