# 데이터 수집 부족 원인 분석 리포트

## 🔍 발견된 주요 문제점

### 1. **채널 국가 필터링 부재** ⚠️ **가장 심각**

**문제:**
- `fetchChannelDetails` 함수에서 채널 상세 정보를 가져올 때 `snippet.country`를 가져오지만
- 실제로 검색한 국가 코드(`countryCode`)와 일치하는지 확인하지 않음
- 예: "이탈리아 엔터테인먼트"로 검색해도 실제 채널 국가가 다른 국가일 수 있음

**현재 코드:**
```typescript
// scripts/daily-auto-collect.ts:165-178
if (subscriberCount >= MIN_SUBSCRIBER_COUNT && viewCount >= MIN_VIEW_COUNT) {
  results.push({
    channelId: item.id,
    channelName: snippet.title,
    // ...
    country: snippet.country || null, // 국가 정보는 가져오지만 필터링 안 함
  });
}
```

**영향:**
- 검색 결과에 다른 국가 채널이 포함될 수 있음
- 이탈리아/태국 검색 시 미국/영국 채널이 섞일 수 있음

---

### 2. **저장 시 국가 코드 강제** ⚠️

**문제:**
- `saveChannel` 함수에서 `countryCode`를 강제로 저장
- 실제 채널의 국가(`channelData.country`)와 다를 수 있음
- 이로 인해 데이터 불일치 발생

**현재 코드:**
```typescript
// scripts/daily-auto-collect.ts:259-272
await prisma.youTubeChannel.create({
  data: {
    // ...
    country: countryCode, // 검색한 국가 코드 강제 저장
    // channelData.country는 무시됨
  },
});
```

**영향:**
- 데이터베이스에 잘못된 국가 코드가 저장됨
- 국가별 필터링 시 정확한 결과를 얻을 수 없음

---

### 3. **검색 쿼리의 한계** ⚠️

**문제:**
- 검색 쿼리가 영어로만 되어 있음
  - 예: "Italy entertainment", "Thailand music"
- 현지어 키워드 미사용
  - 예: "intrattenimento italiano", "เพลงไทย"
- YouTube API의 `regionCode`는 검색 결과의 지역 설정이지, 채널의 실제 국가를 필터링하지 않음

**현재 코드:**
```typescript
// scripts/daily-auto-collect.ts:342-348
const queries = [
  `${countryName} ${keyword}`,      // "Italy entertainment"
  `${keyword} ${countryName}`,      // "entertainment Italy"
  `top ${countryName} ${keyword}`, // "top Italy entertainment"
  `best ${countryName} ${keyword}`, // "best Italy entertainment"
  `popular ${countryName} ${keyword}`, // "popular Italy entertainment"
];
```

**영향:**
- 현지어 콘텐츠를 찾기 어려움
- 검색 결과가 제한적

---

### 4. **최소 기준 필터링이 너무 엄격** ⚠️

**문제:**
- `MIN_SUBSCRIBER_COUNT = 1000` (최소 구독자 수)
- `MIN_VIEW_COUNT = 10000` (최소 조회수)
- 작은 국가의 채널들이 제외될 수 있음

**현재 코드:**
```typescript
// scripts/daily-auto-collect.ts:28-29
const MIN_SUBSCRIBER_COUNT = 1000;
const MIN_VIEW_COUNT = 10000;

// scripts/daily-auto-collect.ts:165
if (subscriberCount >= MIN_SUBSCRIBER_COUNT && viewCount >= MIN_VIEW_COUNT) {
  // 필터링 통과
}
```

**영향:**
- 이탈리아/태국 등 작은 국가의 채널들이 제외될 수 있음
- 데이터 수집량이 제한적

---

## 🛠️ 해결 방안

### 1. **채널 국가 필터링 추가** (필수)

```typescript
// fetchChannelDetails 함수 수정
async function fetchChannelDetails(
  channelIds: string[],
  targetCountryCode: string // 추가
): Promise<any[]> {
  // ...
  if (subscriberCount >= MIN_SUBSCRIBER_COUNT && viewCount >= MIN_VIEW_COUNT) {
    // 국가 필터링 추가
    const channelCountry = snippet.country || null;
    
    // 국가 코드가 일치하거나 null인 경우만 포함
    // (null인 경우는 YouTube API에서 국가 정보를 제공하지 않는 경우)
    if (!channelCountry || channelCountry === targetCountryCode) {
      results.push({
        // ...
        country: channelCountry || targetCountryCode,
      });
    }
  }
}
```

### 2. **저장 시 실제 국가 코드 사용** (필수)

```typescript
// saveChannel 함수 수정
async function saveChannel(
  channelData: any,
  categoryId: string,
  countryCode: string
): Promise<boolean> {
  // 실제 채널 국가 코드 사용 (우선순위)
  const actualCountryCode = channelData.country || countryCode;
  
  await prisma.youTubeChannel.create({
    data: {
      // ...
      country: actualCountryCode, // 실제 국가 코드 사용
    },
  });
}
```

### 3. **현지어 키워드 추가** (권장)

```typescript
// 국가별 현지어 키워드 매핑 추가
const LOCAL_KEYWORDS: Record<string, Record<string, string[]>> = {
  IT: { // 이탈리아
    entertainment: ["intrattenimento", "divertimento", "spettacolo"],
    music: ["musica italiana", "canzoni italiane"],
    // ...
  },
  TH: { // 태국
    entertainment: ["บันเทิง", "ความบันเทิง"],
    music: ["เพลงไทย", "ดนตรีไทย"],
    // ...
  },
  // ...
};

// 검색 쿼리에 현지어 키워드 추가
const queries = [
  `${countryName} ${keyword}`,
  `${keyword} ${countryName}`,
  // 현지어 키워드 추가
  ...(LOCAL_KEYWORDS[countryCode]?.[category.id] || []).map(localKeyword => 
    `${localKeyword} ${countryName}`
  ),
];
```

### 4. **국가별 최소 기준 조정** (권장)

```typescript
// 국가별 최소 기준 매핑
const COUNTRY_MIN_STANDARDS: Record<string, { subscribers: number; views: number }> = {
  IT: { subscribers: 500, views: 5000 },   // 이탈리아
  TH: { subscribers: 500, views: 5000 },   // 태국
  // 작은 국가는 기준 낮춤
  // ...
};

// 기본값 사용
const minSubs = COUNTRY_MIN_STANDARDS[countryCode]?.subscribers || MIN_SUBSCRIBER_COUNT;
const minViews = COUNTRY_MIN_STANDARDS[countryCode]?.views || MIN_VIEW_COUNT;
```

---

## 📋 우선순위

1. **높음 (필수)**: 채널 국가 필터링 추가
2. **높음 (필수)**: 저장 시 실제 국가 코드 사용
3. **중간 (권장)**: 현지어 키워드 추가
4. **중간 (권장)**: 국가별 최소 기준 조정

---

## 🎯 예상 효과

- **이탈리아/태국 등 데이터 200개 이상 확보**
- **국가별 데이터 정확도 향상**
- **검색 결과 품질 개선**
- **데이터베이스 일관성 향상**

