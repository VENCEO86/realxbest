# 국가별 현지어 기반 검색 개선 설계안

## 📋 현재 상황 분석

### ✅ 구현된 부분
1. **일부 국가 현지어 키워드**: IT, TH, JP, CN, ES, FR, DE, VN, PH, ID 등
2. **언어 코드 매핑**: `COUNTRY_LANGUAGE_CODES`로 `hl` 파라미터 설정
3. **YouTube API 파라미터**: `hl`, `relevanceLanguage`, `regionCode` 사용 중

### ❌ 문제점
1. **검색어 생성 로직**: 영어 키워드가 주로 사용됨
2. **현지어 키워드 부족**: 대부분 국가에 현지어 키워드 없음
3. **검색 우선순위**: 현지어 키워드보다 영어 키워드가 먼저 사용됨
4. **기관/단체 필터링 없음**: 개인 유튜버와 기관 채널 구분 없음
5. **채널 타입 필터링 없음**: 개인 유튜버 위주로 필터링하는 로직 없음

---

## 🎯 개선 목표

### 1. 국가별 현지어 우선 검색
- 각 국가의 언어로 검색어 생성
- 현지어 키워드를 우선적으로 사용
- 영어 키워드는 보조적으로 사용

### 2. 개인 유튜버 위주 수집
- 기관/단체 채널 제외
- 개인 크리에이터 위주로 필터링
- 영향력 있는 개인 유튜버 우선 수집

### 3. 지역 기반 검색 강화
- `regionCode` 파라미터 활용 (검색 결과의 지역 설정)
- 채널의 `country` 필드 확인 (유튜브 운영자 위치)
- 동영상 메타데이터 위치 정보 확인 (포스팅 국가)
- `hl` (host language) 파라미터로 언어 설정
- `relevanceLanguage`로 관련성 향상

### 4. 위치 기반 필터링 강화
- 채널 소유자의 국가 (`snippet.country`) 우선 확인
- 동영상 업로드 위치 정보 활용 (가능한 경우)
- `regionCode`로 검색 결과 지역 제한
- 국가 불일치 시 필터링 옵션 제공

---

## 🏗️ 설계 구조

### 1. 국가별 언어 매핑 확장

```typescript
// 모든 국가의 언어 코드 매핑 (현재 일부만 있음)
const COUNTRY_LANGUAGE_CODES: Record<string, string> = {
  // 아시아
  JP: "ja",      // 일본어 ✅
  CN: "zh",      // 중국어 ✅
  KR: "ko",      // 한국어 ✅
  TH: "th",      // 태국어 ✅
  VN: "vi",      // 베트남어 ✅
  ID: "id",      // 인도네시아어 ✅
  MY: "ms",      // 말레이어 ✅
  PH: "en",      // 필리핀 (영어/타갈로그어 혼합)
  IN: "hi",      // 힌디어 ✅
  BD: "bn",      // 방글라데시어 (벵골어)
  PK: "ur",      // 우르두어
  MM: "my",      // 미얀마어
  KH: "km",      // 캄보디아어
  LA: "lo",      // 라오어
  TW: "zh-TW",   // 중국어 번체 ✅
  HK: "zh-HK",   // 중국어 번체 ✅
  SG: "en",      // 영어 ✅
  
  // 유럽
  IT: "it",      // 이탈리아어 ✅
  ES: "es",      // 스페인어 ✅
  FR: "fr",      // 프랑스어 ✅
  DE: "de",      // 독일어 ✅
  PT: "pt",      // 포르투갈어 ✅
  NL: "nl",      // 네덜란드어 ✅
  PL: "pl",      // 폴란드어 ✅
  RU: "ru",      // 러시아어 ✅
  GR: "el",      // 그리스어 ✅
  CZ: "cs",      // 체코어 ✅
  RO: "ro",      // 루마니아어 ✅
  HU: "hu",      // 헝가리어 ✅
  UA: "uk",      // 우크라이나어 ✅
  TR: "tr",      // 터키어 ✅
  CH: "de",      // 독일어/프랑스어/이탈리아어
  AT: "de",      // 독일어
  BE: "nl",      // 네덜란드어/프랑스어
  SE: "sv",      // 스웨덴어
  NO: "no",      // 노르웨이어
  DK: "da",      // 덴마크어
  FI: "fi",      // 핀란드어
  
  // 중동
  SA: "ar",      // 아랍어 ✅
  AE: "ar",      // 아랍어 ✅
  EG: "ar",      // 아랍어 ✅
  IL: "he",      // 히브리어 ✅
  
  // 아메리카
  US: "en",      // 영어 ✅
  CA: "en",      // 영어 ✅
  MX: "es",      // 스페인어 ✅
  BR: "pt",      // 포르투갈어 ✅
  AR: "es",      // 스페인어 ✅
  CL: "es",      // 스페인어 ✅
  CO: "es",      // 스페인어 ✅
  PE: "es",      // 스페인어 ✅
  
  // 오세아니아
  AU: "en",      // 영어 ✅
  NZ: "en",      // 영어 ✅
  
  // 아프리카
  ZA: "en",      // 영어
  NG: "en",      // 영어
  KE: "en",      // 영어
};
```

### 2. 현지어 키워드 확장

```typescript
// 모든 국가의 현지어 키워드 매핑 확장
const LOCAL_KEYWORDS: Record<string, Record<string, string[]>> = {
  // 일본 (확장 필요)
  JP: {
    entertainment: [
      "エンターテインメント", "エンタメ", "ユーチューバー", "YouTuber",
      "チャンネル", "チャンネル登録", "人気ユーチューバー", "有名ユーチューバー",
      "日本のYouTuber", "日本のチャンネル", "日本のクリエイター",
      "エンタメYouTuber", "コメディアン", "お笑い", "バラエティ"
    ],
    music: [
      "音楽", "ミュージック", "歌", "アーティスト", "歌手",
      "日本の音楽", "J-POP", "日本のアーティスト", "日本の歌手",
      "音楽チャンネル", "音楽YouTuber"
    ],
    // ... 각 카테고리별 확장
  },
  
  // 이탈리아 (현재 잘 구현됨)
  IT: {
    // ... 현재 구현 유지
  },
  
  // 태국 (확장 필요)
  TH: {
    entertainment: [
      "บันเทิง", "ความบันเทิง", "ความสนุก", "ยูทูบเบอร์ไทย",
      "ช่องไทย", "ครีเอเตอร์ไทย", "คนดัง", "ยอดนิยม",
      "ยูทูบเบอร์ยอดนิยม", "ช่องยอดนิยม", "ครีเอเตอร์ยอดนิยม"
    ],
    // ... 각 카테고리별 확장
  },
  
  // 모든 국가에 현지어 키워드 추가 필요
};
```

### 3. 검색 쿼리 생성 로직 개선

```typescript
// 현지어 우선 검색 쿼리 생성
function generateLocalizedQueries(
  countryCode: string,
  category: string,
  localKeywords: string[],
  englishKeywords: string[]
): string[] {
  const queries: string[] = [];
  const languageCode = COUNTRY_LANGUAGE_CODES[countryCode] || "en";
  
  // 1. 현지어 키워드 우선 (70%)
  for (const localKeyword of localKeywords) {
    queries.push(
      localKeyword,                                    // "ユーチューバー"
      `${localKeyword} ${countryName}`,                // "ユーチューバー 日本"
      `${countryName} ${localKeyword}`,                // "日本 ユーチューバー"
      `人気 ${localKeyword}`,                          // "人気 ユーチューバー"
      `有名 ${localKeyword}`,                          // "有名 ユーチューバー"
      `トップ ${localKeyword}`,                        // "トップ ユーチューバー"
    );
  }
  
  // 2. 영어 키워드 보조 (30%)
  for (const englishKeyword of englishKeywords) {
    queries.push(
      `${countryName} ${englishKeyword}`,             // "Japan entertainment"
      `${englishKeyword} ${countryName}`,             // "entertainment Japan"
      `top ${countryName} ${englishKeyword}`,         // "top Japan entertainment"
    );
  }
  
  return queries;
}
```

### 4. 개인 유튜버 필터링 로직

```typescript
// 기관/단체 채널 제외 키워드
const EXCLUDE_KEYWORDS = [
  // 영어
  "official", "news", "tv", "channel", "media", "network",
  "corporation", "company", "inc", "ltd", "group",
  "government", "ministry", "department", "agency",
  
  // 일본어
  "公式", "ニュース", "テレビ", "チャンネル", "メディア",
  "会社", "株式会社", "政府", "省", "庁",
  
  // 중국어
  "官方", "新闻", "电视台", "频道", "媒体",
  "公司", "政府", "部门", "机构",
  
  // 한국어
  "공식", "뉴스", "방송", "채널", "미디어",
  "회사", "정부", "부", "청",
  
  // 이탈리아어
  "ufficiale", "notizie", "televisione", "canale", "media",
  "azienda", "governo", "ministero",
  
  // 스페인어
  "oficial", "noticias", "televisión", "canal", "medios",
  "empresa", "gobierno", "ministerio",
  
  // 프랑스어
  "officiel", "actualités", "télévision", "chaîne", "médias",
  "entreprise", "gouvernement", "ministère",
  
  // 독일어
  "offiziell", "Nachrichten", "Fernsehen", "Kanal", "Medien",
  "Unternehmen", "Regierung", "Ministerium",
  
  // 아랍어
  "رسمي", "أخبار", "تلفزيون", "قناة", "إعلام",
  "شركة", "حكومة", "وزارة",
];

// 개인 유튜버 필터링 함수
function isPersonalCreator(channelName: string, description: string): boolean {
  const nameLower = channelName.toLowerCase();
  const descLower = (description || "").toLowerCase();
  
  // 기관/단체 키워드 포함 시 제외
  for (const keyword of EXCLUDE_KEYWORDS) {
    if (nameLower.includes(keyword.toLowerCase()) || 
        descLower.includes(keyword.toLowerCase())) {
      return false;
    }
  }
  
  // 개인 유튜버 특징 확인
  // 1. 이름에 개인 이름 패턴 포함 (예: "John's Channel", "田中チャンネル")
  // 2. 설명에 "vlog", "personal", "creator" 등 포함
  // 3. 구독자 수가 적절한 범위 (너무 많으면 기관일 가능성)
  
  return true;
}
```

### 5. 검색 우선순위 개선

```typescript
// 검색 쿼리 우선순위
const SEARCH_PRIORITY = {
  // 1순위: 현지어 키워드 + 국가명
  priority1: (localKeyword: string, countryName: string) => [
    localKeyword,
    `${countryName} ${localKeyword}`,
    `${localKeyword} ${countryName}`,
  ],
  
  // 2순위: 현지어 키워드 + 인기/유명 키워드
  priority2: (localKeyword: string) => [
    `人気 ${localKeyword}`,      // 일본어: "인기"
    `有名 ${localKeyword}`,      // 일본어: "유명"
    `トップ ${localKeyword}`,    // 일본어: "톱"
  ],
  
  // 3순위: 영어 키워드 + 국가명
  priority3: (englishKeyword: string, countryName: string) => [
    `${countryName} ${englishKeyword}`,
    `${englishKeyword} ${countryName}`,
  ],
};
```

### 6. 위치 기반 필터링 강화

```typescript
// 위치 기반 필터링 로직
function filterByLocation(
  channel: any,
  targetCountryCode: string,
  strictMode: boolean = false
): boolean {
  const channelCountry = channel.country || null;
  
  // 1. 채널 소유자의 국가 확인 (우선순위 1)
  if (channelCountry) {
    if (channelCountry === targetCountryCode) {
      return true; // 정확히 일치
    }
    
    // 엄격 모드: 국가 불일치 시 제외
    if (strictMode) {
      return false;
    }
    
    // 완화 모드: 인접 국가 또는 관련 국가 허용
    // 예: 대만(TW) → 중국(CN), 홍콩(HK) → 중국(CN)
    const relatedCountries: Record<string, string[]> = {
      TW: ["CN"], // 대만 → 중국
      HK: ["CN"], // 홍콩 → 중국
      MO: ["CN"], // 마카오 → 중국
    };
    
    if (relatedCountries[targetCountryCode]?.includes(channelCountry)) {
      return true; // 관련 국가 허용
    }
  }
  
  // 2. 국가 정보가 없는 경우 (null)
  // - regionCode로 검색했으므로 해당 지역 결과일 가능성 높음
  // - 완화 모드에서는 포함
  if (!channelCountry && !strictMode) {
    return true;
  }
  
  // 3. 엄격 모드에서 국가 불일치 시 제외
  return false;
}

// 검색 시 regionCode 활용
async function searchChannelsWithLocation(
  query: string,
  countryCode: string,
  languageCode: string,
  maxResults: number = 50
): Promise<Array<{ channelId: string; channelName: string }>> {
  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "channel",
    maxResults: String(maxResults),
    order: "viewCount",
    regionCode: countryCode, // ✅ 위치 기반 필터링
    hl: languageCode,         // ✅ 언어 설정
    relevanceLanguage: languageCode, // ✅ 관련 언어 설정
    key: apiKey,
  });
  
  // regionCode로 해당 지역의 검색 결과 우선 반환
  // 채널 상세 정보에서 country 필드로 추가 필터링
}
```

---

## 📝 구현 계획

### Phase 1: 언어 매핑 확장
1. 모든 국가의 언어 코드 매핑 완성
2. 누락된 국가 언어 코드 추가

### Phase 2: 현지어 키워드 확장
1. 주요 국가(JP, TH, CN, KR 등) 현지어 키워드 확장
2. 각 카테고리별 현지어 키워드 추가
3. 검색 쿼리 생성 시 현지어 키워드 우선 사용

### Phase 3: 개인 유튜버 필터링
1. 기관/단체 채널 제외 키워드 정의
2. 채널명/설명 기반 필터링 로직 구현
3. 개인 유튜버 특징 확인 로직 추가

### Phase 4: 검색 로직 개선
1. 현지어 키워드 우선 검색 구현
2. 검색 쿼리 우선순위 적용
3. 지역 기반 검색 강화

---

## 🎯 예상 효과

1. **검색 정확도 향상**: 현지어 검색으로 해당 국가의 실제 인기 유튜버 발견
2. **데이터 품질 향상**: 개인 유튜버 위주로 수집하여 영향력 있는 크리에이터 확보
3. **다양성 확보**: 각 국가의 언어와 문화에 맞는 채널 수집
4. **사용자 경험 향상**: 각 국가의 실제 인기 유튜버를 정확하게 제공

---

## 💡 추가 고려사항

1. **다국어 국가 처리**: 싱가포르, 홍콩 등 다국어 국가는 여러 언어로 검색
2. **방언 처리**: 중국어(간체/번체), 아랍어(방언) 등 처리
3. **API 할당량 관리**: 현지어 검색 증가에 따른 할당량 관리
4. **캐싱 전략**: 검색 결과 캐싱으로 할당량 절약
5. **위치 기반 필터링**: 
   - 채널 소유자 위치 (`snippet.country`) 우선 확인
   - 동영상 업로드 위치 정보 활용
   - `regionCode`로 검색 결과 지역 제한
   - 국가 불일치 시 필터링 옵션 제공

