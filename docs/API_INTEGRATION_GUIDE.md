# 실제 YouTube API 연동 가이드

## 문제점
현재 Mock 데이터를 사용하고 있어 실제 데이터가 아닙니다. 실제 YouTube 채널 데이터를 가져오려면 API 연동이 필요합니다.

## 해결 방법 제안

### 방법 1: YouTube Data API v3 (추천) ⭐

**장점:**
- 공식 API, 안정적
- 무료 할당량 제공 (일일 10,000 units)
- 채널 정보, 통계, 동영상 등 모든 데이터 제공

**단점:**
- API 키 필요
- Rate limiting 존재
- 국가별 필터는 직접 구현 필요

**구현 단계:**

1. **API 키 발급**
   ```bash
   # Google Cloud Console 접속
   # https://console.cloud.google.com/
   # 1. 프로젝트 생성
   # 2. YouTube Data API v3 활성화
   # 3. 사용자 인증 정보 > API 키 생성
   ```

2. **환경 변수 설정**
   ```env
   YOUTUBE_API_KEY=your_api_key_here
   ```

3. **채널 데이터 수집 스크립트**
   ```typescript
   // scripts/fetch-youtube-channels.ts
   // 인기 채널 ID 목록을 수집하여 데이터베이스에 저장
   ```

4. **국가별 필터링**
   - 채널의 `country` 필드를 YouTube API의 `snippet.country`로 설정
   - 또는 채널 설명/메타데이터 분석으로 국가 추론

**API 사용 예시:**
```typescript
// 채널 정보 가져오기
GET https://www.googleapis.com/youtube/v3/channels
  ?part=snippet,statistics,contentDetails
  &id=CHANNEL_ID
  &key=API_KEY

// 응답 예시
{
  "items": [{
    "id": "UC-lHJZR3Gqxm24_Vd_AJ5Yw",
    "snippet": {
      "title": "PewDiePie",
      "country": "SE",
      "customUrl": "@pewdiepie"
    },
    "statistics": {
      "subscriberCount": "111000000",
      "viewCount": "28000000000",
      "videoCount": "4700"
    }
  }]
}
```

### 방법 2: NoxInfluencer API (유료 가능)

**장점:**
- 이미 정제된 데이터
- 국가별 순위 제공
- 추가 분석 데이터

**단점:**
- API 접근 제한 가능
- 유료일 수 있음
- API 문서 공개 여부 불확실

**구현 방법:**
1. NoxInfluencer 개발자 포털 확인
2. API 키 발급 (회원가입 필요)
3. 엔드포인트 확인 및 연동

### 방법 3: Social Blade API (유료)

**장점:**
- 전문적인 인플루언서 데이터
- 다양한 플랫폼 지원

**단점:**
- 유료 서비스
- API 접근 제한

### 방법 4: 하이브리드 접근 (추천) ⭐⭐

**구조:**
1. **초기 데이터 수집**: YouTube Data API로 인기 채널 수집
2. **정기 업데이트**: Cron job으로 주기적 업데이트
3. **국가별 필터**: 채널 메타데이터 기반 자동 분류

**구현 예시:**
```typescript
// lib/youtube-data-collector.ts
export async function collectTopChannelsByCountry(
  countryCode: string,
  maxResults: number = 100
) {
  // 1. YouTube Search API로 해당 국가 인기 채널 검색
  // 2. 채널 정보 수집
  // 3. 데이터베이스에 저장
}
```

## 즉시 구현 가능한 방법

### 단계 1: YouTube Data API 연동

이미 `lib/youtube-api.ts`에 기본 함수가 있습니다. 이를 활용하여:

1. **인기 채널 ID 목록 수집**
   - 수동으로 인기 채널 ID 목록 작성
   - 또는 YouTube Search API로 수집

2. **데이터 수집 스크립트 실행**
   ```bash
   # 환경 변수 설정
   export YOUTUBE_API_KEY=your_key
   
   # 스크립트 실행
   npm run fetch-channels
   ```

3. **정기 업데이트**
   - Cron job 설정
   - 또는 GitHub Actions로 주기적 실행

### 단계 2: 국가별 필터 개선

YouTube API의 `snippet.country` 필드를 활용:

```typescript
// 채널 수집 시 국가 정보 포함
const channelData = {
  ...youtubeData,
  country: snippet.country || null, // "US", "KR", "JP" 등
};
```

### 단계 3: 실시간 데이터 vs 캐시

**전략:**
- **캐시**: 데이터베이스에 저장, 주기적 업데이트 (1시간/1일)
- **실시간**: 사용자 요청 시 API 호출 (선택적)

## 구현 우선순위

1. ✅ **즉시**: YouTube Data API 키 발급 및 기본 연동
2. ✅ **단기**: 인기 채널 100-1000개 수집 스크립트
3. ✅ **중기**: 국가별 필터 자동화
4. ✅ **장기**: 실시간 업데이트 시스템

## 예상 비용

- **YouTube Data API**: 무료 (일일 10,000 units)
  - 채널 조회: 1 unit
  - 10,000개 채널/일 무료
- **서버**: 기존 서버 사용 (추가 비용 없음)

## 다음 단계

1. YouTube API 키 발급
2. `scripts/fetch-youtube-channels.ts` 구현
3. 데이터 수집 및 저장
4. 국가별 필터 테스트



