#!/bin/bash
# Render Cron Job 스크립트
# 데일리 채널 수집 실행

echo "🚀 데일리 채널 수집 시작..."
echo "시간: $(date)"

# 환경 변수 확인
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL이 설정되지 않았습니다."
  exit 1
fi

if [ -z "$YOUTUBE_API_KEYS" ]; then
  echo "❌ YOUTUBE_API_KEYS가 설정되지 않았습니다."
  exit 1
fi

# Prisma 클라이언트 생성
echo "📦 Prisma 클라이언트 생성 중..."
npx prisma generate

# 데이터베이스 설정
echo "🗄️ 데이터베이스 설정 중..."
npm run setup-db

# 채널 수집 실행
echo "📊 채널 수집 시작..."
npm run collect-daily

echo "✅ 완료!"

