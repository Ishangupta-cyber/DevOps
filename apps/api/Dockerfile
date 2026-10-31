# Backend image: Express JSON API only (the frontend has its own image).
# Build from the repo root so npm can use the workspace lockfile:
#   docker build -f apps/api/Dockerfile -t daymark-api .
FROM node:22-alpine

WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
RUN npm ci --omit=dev

COPY apps/api ./apps/api
ENV NODE_ENV=production
EXPOSE 3000
USER node
CMD ["npm", "start"]
