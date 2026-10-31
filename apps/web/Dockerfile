# Frontend image: nginx serves the static files and proxies /api to the
# backend container named "api".
#   docker build -t daymark-web apps/web
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html app.js styles.css /usr/share/nginx/html/
EXPOSE 80
