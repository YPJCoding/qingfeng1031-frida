#!/bin/bash
set -e

HOST="aliyun"
TARGET="/data/data/frida"

echo "=== 同步源码到 ${HOST}:${TARGET} ==="

COPYFILE_DISABLE=1 tar czf - \
  --exclude='frida.so' \
  --exclude='.git' \
  --exclude='.idea' \
  --exclude='*.md' \
  --exclude='deploy.sh' \
  . | ssh "${HOST}" "tar xzf - -C ${TARGET}"

echo "=== 重启 Docker 容器 ==="
ssh "${HOST}" "docker restart dnf"

echo "=== 完成 ==="
