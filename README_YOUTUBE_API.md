# YouTube API 연동 가이드

## 🎯 목표
실제 YouTube 채널 데이터를 가져와서 사이트에 표시하기

## 📋 단계별 가이드

### 1단계: YouTube API 키 발급

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com/

2. **프로젝트 생성**
   - 새 프로젝트 생성 또는 기존 프로젝트 선택

3. **YouTube Data API v3 활성화**
   - "API 및 서비스" > "라이브러리"
   - "YouTube Data API v3" 검색
   - "사용" 클릭

4. **API 키 생성**
   - "사용자 인증 정보" > "사용자 인증 정보 만들기" > "API 키"
   - 생성된 키 복사

### 2단계: 환경 변수 설정

`.env` 파일 생성 (또는 기존 파일에 추가):

```env
YOUTUBE_API_KEY=your_api_key_here
DATABASE_URL=postgresql://user:password@localhost:5432/korxyoutube
```

### 3단계: 채널 데이터 수집

#### 방법 A: 스크립트 실행 (추천)

```bash
# 환경 변수 설정 (Windows PowerShell)
$env:YOUTUBE_API_KEY="your_api_key_here"
$env:DATABASE_URL="postgresql://user:password@localhost:5432/korxyoutube"

# 데이터베이스 마이그레이션
npm run db:push

# 채널 데이터 수집
npm run fetch-channels
```

#### 방법 B: API 엔드포인트 사용

```bash
curl -X POST http://localhost:3001/api/youtube/sync \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your_api_key",
    "channelIds": [
      "UC-lHJZR3Gqxm24_Vd_AJ5Yw",
      "UCX6OQ3DkcsbYNE6H8uQQuVA"
    ]
  }'
```

### 4단계: 인기 채널 ID 찾기

#### 방법 1: YouTube에서 직접 확인
1. YouTube 채널 페이지 접속
2. URL에서 채널 ID 확인
   - 예: `youtube.com/channel/UC-lHJZR3Gqxm24_Vd_AJ5Yw`
   - `UC-lHJZR3Gqxm24_Vd_AJ5Yw`가 채널 ID

#### 방법 2: YouTube Search API 사용
```typescript
// 인기 채널 검색
GET https://www.googleapis.com/youtube/v3/search
  ?part=snippet
  &type=channel
  &order=viewCount
  &maxResults=50
  &key=API_KEY
```

#### 방법 3: 기존 순위 사이트 참고
- Social Blade
- NoxInfluencer
- VidIQ

### 5단계: 국가별 채널 수집

각 국가별로 인기 채널을 수집하려면:

```typescript
// scripts/fetch-by-country.ts
// 각 국가별로 채널 검색 및 수집
const countries = ["US", "KR", "JP", "GB", "DE", ...];
```

## 🔧 문제 해결

### API 할당량 초과
- **원인**: 일일 10,000 units 초과
- **해결**: 
  - 여러 API 키 사용 (회전)
  - 캐싱 활용
  - 배치 처리 최적화

### 채널을 찾을 수 없음
- **원인**: 채널 ID가 잘못되었거나 채널이 삭제됨
- **해결**: 채널 ID 확인 및 유효성 검사

### 국가 정보가 없음
- **원인**: YouTube API의 `snippet.country`가 null
- **해결**: 
  - 채널 설명/메타데이터 분석
  - 수동으로 국가 지정
  - IP 기반 추론 (부정확)

## 📊 데이터 업데이트 전략

### 옵션 1: 주기적 업데이트 (추천)
```bash
# Cron job 또는 GitHub Actions
# 매일 자정에 실행
0 0 * * * npm run fetch-channels
```

### 옵션 2: 실시간 업데이트
- 사용자 요청 시 API 호출
- 캐시 활용 (1시간 TTL)

### 옵션 3: 하이브리드
- 기본 데이터: 주기적 업데이트
- 상세 정보: 실시간 조회

## 💰 비용

- **YouTube Data API**: 무료 (일일 10,000 units)
  - 채널 조회: 1 unit
  - 검색: 100 units
  - **예상**: 10,000개 채널/일 무료

## ✅ 체크리스트

- [ ] YouTube API 키 발급
- [ ] 환경 변수 설정
- [ ] 데이터베이스 연결 확인
- [ ] 채널 ID 목록 준비
- [ ] 데이터 수집 스크립트 실행
- [ ] 브라우저에서 데이터 확인
- [ ] 국가별 필터 테스트

## 🚀 빠른 시작

```bash
# 1. API 키 설정
export YOUTUBE_API_KEY="your_key"

# 2. 데이터베이스 설정
export DATABASE_URL="postgresql://..."

# 3. 마이그레이션
npm run db:push

# 4. 데이터 수집
npm run fetch-channels

# 5. 확인
npm run dev
# 브라우저에서 http://localhost:3001 접속
```

## 📚 참고 자료

- [YouTube Data API 문서](https://developers.google.com/youtube/v3)
- [API 할당량 가이드](https://developers.google.com/youtube/v3/getting-started#quota)
- [채널 ID 찾기](https://support.google.com/youtube/answer/3250431)


