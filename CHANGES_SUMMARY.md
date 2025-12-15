# 이탈리아 채널 수집 개선 - 변경 사항 요약

## 📋 변경된 파일

1. **scripts/daily-auto-collect.ts** (수정됨)
   - 이탈리아 채널 수집 로직 대폭 개선

2. **scripts/check-italy-channels.ts** (신규)
   - 이탈리아 채널 수 확인 스크립트

3. **ITALY_COLLECTION_IMPROVEMENTS.md** (신규)
   - 개선 사항 상세 문서

## 🔍 주요 변경 내용

### 1. 이탈리아 현지어 키워드 확대
- **Entertainment**: 9개 → 20개
- **Music**: 7개 → 15개
- **Education**: 3개 → 10개
- **Gaming**: 3개 → 12개
- **Sports**: 3개 → 12개
- **News**: 3개 → 10개
- **People**: 3개 → 12개
- **Howto**: 3개 → 10개

### 2. 검색량 증가
- 일반 국가: 필요량의 **3배**
- 이탈리아: 필요량의 **5배**

### 3. 최소 기준 완화
- 일반: 구독자 100명, 조회수 1,000
- 이탈리아: 구독자 **50명**, 조회수 **500**

### 4. 검색 쿼리 수 증가
- 일반: 키워드당 17개
- 이탈리아: 키워드당 **30개**

## 🚀 실행 방법

### 로컬 실행
```bash
# 환경 변수 확인 필요
# DATABASE_URL
# YOUTUBE_API_KEYS

# 실행
npm run collect:daily
```

### GitHub Actions 실행
1. GitHub 저장소 → Actions 탭
2. "Daily Channel Collection" 워크플로우 선택
3. "Run workflow" 클릭

## 📊 예상 효과

- 기존: 17개 채널
- 예상: **200개 이상** 채널 (약 12배 증가)

## ⚠️ 주의사항

- API 할당량 관리 필요
- 수집 시간 증가 가능
- 데이터베이스 저장 공간 확인 필요

