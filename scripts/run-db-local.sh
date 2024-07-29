#!/bin/sh

docker run -d \
  --name ts-db \
  -p 33306:3306 \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=ts \
  mysql:8.0.28
