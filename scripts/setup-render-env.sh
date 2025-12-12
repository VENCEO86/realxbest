#!/bin/bash
# Render 환경 변수 자동 설정 스크립트
# Render API를 사용하여 환경 변수를 설정합니다

# Render API 키가 필요합니다 (Render 대시보드 > Account Settings > API Keys)
RENDER_API_KEY="${RENDER_API_KEY:-}"
SERVICE_ID="${RENDER_SERVICE_ID:-srv-d48p38jipnbc73dkh990}"

# 환경 변수 설정
ENV_VARS=(
  "YOUTUBE_API_KEYS=AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY,AIzaSyCjxqyzAGEmC21uyXVk1loyvqeOi3fDaB4,AIzaSyBfD3EPz6DL6J_I05fgT9zt3_iyZ39DkpU"
  "YOUTUBE_API_KEY=AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY"
  "NEXT_PUBLIC_BASE_URL=https://realxbest.com"
  "NEXT_PUBLIC_APP_URL=https://realxbest.com"
  "NODE_ENV=production"
  "NEXT_TELEMETRY_DISABLED=1"
)

if [ -z "$RENDER_API_KEY" ]; then
  echo "❌ RENDER_API_KEY 환경 변수가 설정되지 않았습니다."
  echo "Render 대시보드 > Account Settings > API Keys에서 API 키를 생성하세요."
  exit 1
fi

echo "🚀 Render 환경 변수 설정 시작..."
echo "서비스 ID: $SERVICE_ID"
echo ""

# 각 환경 변수를 설정
for env_var in "${ENV_VARS[@]}"; do
  key=$(echo "$env_var" | cut -d'=' -f1)
  value=$(echo "$env_var" | cut -d'=' -f2-)
  
  echo "설정 중: $key"
  
  response=$(curl -s -X PUT \
    "https://api.render.com/v1/services/$SERVICE_ID/env-vars" \
    -H "Authorization: Bearer $RENDER_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"envVar\": {
        \"key\": \"$key\",
        \"value\": \"$value\"
      }
    }")
  
  if echo "$response" | grep -q "error"; then
    echo "  ⚠️  오류: $response"
  else
    echo "  ✅ 성공"
  fi
done

echo ""
echo "✅ 환경 변수 설정 완료!"
echo "Render 대시보드에서 확인하세요: https://dashboard.render.com/web/$SERVICE_ID"

