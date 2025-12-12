# 데이터 연동 가이드

## 1. 샘플 데이터 생성 (빠른 테스트용)

```bash
# TypeScript 실행을 위한 tsx 설치 (아직 없다면)
npm install -D tsx

# 샘플 데이터 생성
npx tsx scripts/seed-sample-data.ts
```

## 2. YouTube Data API 연동 (실제 데이터)

### 2.1 API 키 발급

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "API 및 서비스" > "라이브러리"에서 "YouTube Data API v3" 활성화
4. "사용자 인증 정보" > "사용자 인증 정보 만들기" > "API 키" 선택
5. API 키 복사

### 2.2 환경 변수 설정

`.env` 파일에 추가:

```env
YOUTUBE_API_KEY=your_api_key_here
DATABASE_URL=postgresql://user:password@localhost:5432/korxyoutube
```

### 2.3 데이터 동기화

#### 방법 1: API 엔드포인트 사용

```bash
curl -X POST http://localhost:3001/api/youtube/sync \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "YOUR_API_KEY",
    "channelIds": [
      "UC-lHJZR3Gqxm24_Vd_AJ5Yw",
      "UCX6OQ3DkcsbYNE6H8uQQuVA"
    ]
  }'
```

#### 방법 2: 스크립트 사용

```typescript
// scripts/sync-youtube.ts
import { fetchChannelsBatch } from "@/lib/youtube-api";

const channelIds = [
  "UC-lHJZR3Gqxm24_Vd_AJ5Yw", // PewDiePie
  "UCX6OQ3DkcsbYNE6H8uQQuVA", // MrBeast
  // ... 더 많은 채널 ID
];

const apiKey = process.env.YOUTUBE_API_KEY;
const channels = await fetchChannelsBatch(channelIds, apiKey);
// 데이터베이스에 저장하는 로직 추가
```

## 3. NoxInfluencer 스타일 데이터 수집

NoxInfluencer는 다음과 같은 방식으로 데이터를 수집합니다:

1. **YouTube Data API v3** 사용
2. **정기적인 크롤링** (주간/월간 업데이트)
3. **채널 검색 및 분석**을 통한 데이터 수집
4. **국가별 필터링** (채널의 country 필드 기반)

### 3.1 자동 업데이트 스크립트

```typescript
// scripts/update-rankings.ts
// 주간/월간 순위 업데이트를 위한 스크립트
// cron job으로 실행 가능
```

## 4. 데이터베이스 확인

```bash
# Prisma Studio로 데이터 확인
npm run db:studio
```

## 5. 주의사항

- YouTube Data API는 **일일 할당량**이 있습니다 (기본 10,000 units/day)
- Rate limiting을 고려하여 배치 처리 시 딜레이를 추가했습니다
- 대량의 데이터 수집 시 API 키 할당량을 확인하세요


