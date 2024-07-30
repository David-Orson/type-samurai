#!/bin/sh

PROJECT_DIR="/usr/src/app"

cd "$(dirname "$0")/../client/" || exit 1

docker run -it --rm \
  -w "${PROJECT_DIR}" \
  -v "$(pwd)":"${PROJECT_DIR}" \
  -u "$(id -u):$(id -g)" \
  --network=host \
  node:18.8.0-alpine \
  npm start
