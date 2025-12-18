# 우선순위 국가 데이터 수집 현황

## 📊 수집 대상 국가 (8개)

1. **한국 (KR)** - 한국어 키워드
2. **일본 (JP)** - 일본어 키워드  
3. **중국 (CN)** - 중국어 키워드
4. **독일 (DE)** - 독일어 키워드
5. **영국 (GB)** - 영어 키워드
6. **프랑스 (FR)** - 프랑스어 키워드
7. **브라질 (BR)** - 포르투갈어 키워드
8. **멕시코 (MX)** - 스페인어 키워드

## 🎯 목표

- 각 국가별 최소 **200개 이상** 채널 확보
- 각 카테고리별 최소 **20개 이상** 채널 확보

## 📁 카테고리 (9개)

1. 엔터테인먼트 (Entertainment)
2. 음악 (Music)
3. 게임 (Gaming)
4. 스포츠 (Sports)
5. 교육 (Education)
6. 뉴스/정치 (News/Politics)
7. 인물/블로그 (People/Blog)
8. 노하우/스타일 (Howto/Style)
9. 기타 (Other)

## 🔧 수집 전략

### 각 국가별 설정
- **언어 코드**: 현지어 적용 (ko, ja, zh, de, en, fr, pt, es)
- **지역 코드**: 국가 코드 적용
- **키워드**: 각 카테고리당 15-20개 현지어 키워드
- **검색 정렬**: viewCount, rating, relevance 순차 적용

### 최소 기준 (완화)
- 구독자: **50명 이상**
- 조회수: **500 이상**
- 프로필 이미지: **필수**

### 검색량
- 각 키워드당 최대 1000개 채널 ID 수집
- 각 국가별 최대 9,000개 채널 ID 수집 가능

## 📈 진행 상황 확인

```bash
# 진행 상황 확인
npx tsx scripts/check-priority-countries-progress.ts

# 전체 국가 현황 확인
npx tsx scripts/check-all-countries-data.ts
```

## ⚠️ 주의사항

- API 할당량: 키당 9,000 units
- 수집 시간: 국가당 약 5-10분 소요 예상
- 총 예상 시간: 약 40-80분

## 🚀 실행 방법

```bash
# 환경 변수 설정
export DATABASE_URL="your_database_url"
export YOUTUBE_API_KEYS="key1,key2,key3"

# 실행
npx tsx scripts/collect-priority-countries.ts
```


