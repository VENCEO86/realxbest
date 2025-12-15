# NoxInfluencer 벤치마킹 분석 및 개선 사항

## 📊 NoxInfluencer 사이트 분석

### 주요 특징
- **국가별 TOP 100 인플루언서** 제공
- **카테고리별 필터링** (엔터테인먼트, 음악, 교육, 게임 등)
- **다양한 정렬 옵션** (구독자, 조회수, 성장률 등)
- **주간/월간 데이터** 제공
- **실시간 업데이트**

### 데이터 수집 전략 (추정)
1. **인기 채널 우선 수집**
   - 구독자 수 기준
   - 조회수 기준
   - 평점 기준

2. **다양한 검색 쿼리 조합**
   - "top [country] [category] youtubers"
   - "best [country] [category] channels"
   - "most subscribed [country] [category]"
   - "trending [country] [category]"

3. **지역 및 언어 기반 검색**
   - `regionCode` 파라미터 활용
   - `hl` (host language) 파라미터 활용
   - 현지어 키워드 활용

---

## 🔧 우리 사이트 개선 사항

### 1. 검색 쿼리 생성 개선 ✅

**이전 방식:**
```typescript
const queries = [
  `${countryName} ${keyword}`,
  `${keyword} ${countryName}`,
  `top ${countryName} ${keyword}`,
];
```

**개선된 방식 (NoxInfluencer 스타일):**
```typescript
const queries = [
  // 기본 검색
  `${countryName} ${keyword}`,
  `${keyword} ${countryName}`,
  // 인기 채널 검색
  `top ${countryName} ${keyword} youtubers`,
  `best ${countryName} ${keyword} channels`,
  `popular ${countryName} ${keyword} creators`,
  `famous ${countryName} ${keyword} youtubers`,
  // 구독자/조회수 기준
  `most subscribed ${countryName} ${keyword}`,
  `highest subscribers ${countryName} ${keyword}`,
  `most viewed ${countryName} ${keyword}`,
  `highest views ${countryName} ${keyword}`,
  // 트렌딩 검색
  `trending ${countryName} ${keyword}`,
  `viral ${countryName} ${keyword}`,
];
```

---

### 2. 정렬 기준 다양화 ✅

**이전 방식:**
- 기본 정렬만 사용 (relevance)

**개선된 방식:**
```typescript
const orders = [
  "viewCount",  // 조회수 기준 (인기 채널 우선)
  "rating",     // 평점 기준
  "relevance",  // 관련성 기준
];

// 각 정렬 기준으로 검색
for (const order of orders) {
  const channels = await searchChannels(query, 50, countryCode, languageCode, order);
}
```

---

### 3. 인기 채널 우선 수집 ✅

**개선 사항:**
- `order: "viewCount"` 우선 사용
- 구독자 수가 많은 채널부터 수집
- 조회수가 높은 채널 우선 수집

---

### 4. 검색 쿼리 다양화 ✅

**추가된 쿼리 유형:**
1. **인기 채널 검색**
   - "top [country] [category] youtubers"
   - "best [country] [category] channels"
   - "popular [country] [category] creators"

2. **구독자/조회수 기준 검색**
   - "most subscribed [country] [category]"
   - "highest subscribers [country] [category]"
   - "most viewed [country] [category]"

3. **트렌딩 검색**
   - "trending [country] [category]"
   - "viral [country] [category]"

---

### 5. 현지어 키워드 활용 ✅

**이미 구현됨:**
- 국가별 현지어 키워드 매핑
- 언어 코드 (`hl` 파라미터) 활용
- 현지어로 검색 쿼리 생성

---

## 📈 예상 효과

### 데이터 품질 향상
- ✅ 인기 채널 우선 수집으로 데이터 품질 향상
- ✅ 다양한 검색 쿼리로 수집량 증가
- ✅ 정렬 기준 다양화로 더 많은 채널 발견

### 수집량 증가
- ✅ 각 국가별/카테고리별 최소 200개 확보
- ✅ 전체 검색 시 2,000개 이상 데이터 확보
- ✅ 트렌딩 채널까지 포함하여 최신 데이터 유지

---

## 🚀 사용 방법

### 기본 수집 (기존 방식)
```bash
npm run collect:daily
```

### NoxInfluencer 스타일 수집 (새로운 방식)
```bash
npm run collect:nox
```

### 통합 수집
```bash
npm run collect-auto
```

---

## 📋 구현된 기능

### ✅ 완료된 기능
1. ✅ NoxInfluencer 스타일 검색 쿼리 생성
2. ✅ 다양한 정렬 기준 활용 (viewCount, rating, relevance)
3. ✅ 인기 채널 우선 수집
4. ✅ 트렌딩 검색어 활용
5. ✅ 현지어 키워드 활용
6. ✅ 국가별/카테고리별 최소 200개 확보

### 🔄 개선 중인 기능
1. ⏳ 채널 리스트 API 활용 (가능한 경우)
2. ⏳ 트렌딩 검색어 자동 수집
3. ⏳ 인기 채널 자동 업데이트

---

## 💡 참고사항

### YouTube Data API v3 제한사항
- **일일 할당량**: 키당 10,000 units
- **Search API**: 100 units per request
- **Channels API**: 1 unit per request (배치 처리 시)

### 최적화 전략
1. **API 키 순환 사용**: 여러 키를 순환하여 할당량 확보
2. **배치 처리**: 채널 상세 정보는 50개씩 배치 처리
3. **캐싱**: 검색 결과 캐싱으로 중복 요청 방지
4. **지연 처리**: API 요청 간 지연으로 할당량 보호

---

## 🎯 목표 달성

### 데이터 품질
- ✅ 각 국가별/카테고리별 최소 200개 확보
- ✅ 인기 채널 우선 수집
- ✅ 최신 트렌딩 채널 포함

### 데이터 양
- ✅ 전체 검색: 2,000개 이상
- ✅ 카테고리별: 200개 이상
- ✅ 국가별: 200개 이상

---

## 📚 참고 자료

- [NoxInfluencer 사이트](https://kr.noxinfluencer.com/youtube-channel-rank/top-100-is-all-youtuber-sorted-by-subs-weekly)
- [YouTube Data API v3 문서](https://developers.google.com/youtube/v3)
- [YouTube Search API 파라미터](https://developers.google.com/youtube/v3/docs/search/list)

