#!/bin/bash
set -e

HOST="aliyun"
TARGET="/data/data/frida"

echo "=== 同步源码到 ${HOST}:${TARGET} ==="

ssh "${HOST}" "mkdir -p ${TARGET}/frida_modules/core ${TARGET}/frida_modules/api ${TARGET}/frida_modules/features ${TARGET}/frida_modules/commands ${TARGET}/data"

scp frida.js frida_config.json frida.config "${HOST}:${TARGET}/"
scp frida_modules/main.js frida_modules/legacyAliases.js "${HOST}:${TARGET}/frida_modules/"
scp frida_modules/core/*.js "${HOST}:${TARGET}/frida_modules/core/"
scp frida_modules/api/*.js "${HOST}:${TARGET}/frida_modules/api/"
scp frida_modules/features/*.js "${HOST}:${TARGET}/frida_modules/features/"
scp frida_modules/commands/*.js "${HOST}:${TARGET}/frida_modules/commands/"
scp data/item_name_list.txt "${HOST}:${TARGET}/data/"

echo "=== 清理 plugin.log ==="
ssh "${HOST}" "rm -f ${TARGET}/plugin.log"

echo "=== 重启 Docker 容器 ==="
ssh "${HOST}" "docker restart dnf"

echo "=== 完成 ==="
