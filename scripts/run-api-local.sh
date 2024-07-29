#!/bin/sh

PROJECT_DIR="/go/src/api"

cd "$(dirname "$0")/../api/" || exit 1

docker run -it --rm \
  --name ts-api \
  -w "${PROJECT_DIR}" \
  -e "DB_HOST=0.0.0.0" \
  -e "DB_PORT=33306" \
  -e "DB_USER=root" \
  -e "DB_PASSWORD=password" \
  -e "DB_NAME=ts" \
  -e "air_wd=${PROJECT_DIR}" \
  -v "$(pwd)"/:"${PROJECT_DIR}" \
  -v "$GOPATH"/pkg/mod:/go/pkg/mod \
  --network=host \
  cosmtrek/air:v1.40.4
