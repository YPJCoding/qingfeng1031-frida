#!/bin/bash
set -e

HOST="aliyun"
TARGET="/data/data/frida"

echo "=== 同步源码到 ${HOST}:${TARGET} ==="

scp frida.js frida_config.json frida.config "${HOST}:${TARGET}/"
scp frida_modules/*.js "${HOST}:${TARGET}/frida_modules/"
scp data/item_name_list.txt "${HOST}:${TARGET}/data/"

echo "=== 清理 plugin.log ==="
ssh "${HOST}" "rm -f ${TARGET}/plugin.log"

echo "=== 重启 Docker 容器 ==="
ssh "${HOST}" "docker restart dnf"

echo "=== 完成 ==="
