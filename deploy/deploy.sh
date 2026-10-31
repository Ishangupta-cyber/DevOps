#!/bin/sh
# Runs on the EC2 host. Both deploy workflows call it once the images are
# available locally (loaded from a tarball or pulled from Docker Hub).
# Usage: API_IMAGE=<image> WEB_IMAGE=<image> POSTGRES_PASSWORD=<password> sh deploy.sh
set -eu
cd "$(dirname "$0")"

cat > .env <<ENV
API_IMAGE=$API_IMAGE
WEB_IMAGE=$WEB_IMAGE
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
ENV
chmod 600 .env

docker compose -f docker-compose.prod.yml up -d --remove-orphans

for i in $(seq 1 30); do
  if curl -fs http://localhost/api/health; then
    echo
    echo "Deployed $API_IMAGE and $WEB_IMAGE"
    docker image prune -f
    exit 0
  fi
  sleep 2
done

echo "App did not become healthy"
docker compose -f docker-compose.prod.yml logs --tail 50
exit 1
