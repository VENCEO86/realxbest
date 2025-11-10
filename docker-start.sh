#!/usr/bin/env bash
set -e

# Secret Files가 마운트되는 위치
SECRETS_DIR="/etc/secrets"

# 대상 경로
APP_ROOT="/var/www/html"
DATA_DIR="$APP_ROOT/data"

# 폴더 보장
mkdir -p "$DATA_DIR"

# Render Secret Files 이름은 Environment > Secret Files에 적은 "키"와 동일
if [ -f "$SECRETS_DIR/CONFIG_PHP" ]; then
  cp -f "$SECRETS_DIR/CONFIG_PHP" "$APP_ROOT/config.php"
fi

if [ -f "$SECRETS_DIR/DBCONFIG_PHP" ]; then
  cp -f "$SECRETS_DIR/DBCONFIG_PHP" "$DATA_DIR/dbconfig.php"
fi

# 권한 정리
chown -R www-data:www-data "$APP_ROOT"

# Apache 실행
exec apache2-foreground
