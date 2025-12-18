# API 할당량 문제 분석 및 해결 방안

## 🔍 현재 상황

- 모든 API 키에서 "할당량 소진" 오류 발생
- 한국 채널 수집 시 0개 채널 ID 수집됨

## ⚠️ 가능한 원인

1. **일일 할당량 소진**
   - YouTube Data API v3 기본 할당량: 10,000 units/일
   - 각 Search API 호출: 100 units
   - 각 Channels API 호출: 1 unit

2. **API 키 문제**
   - 키가 유효하지 않음
   - 키가 비활성화됨
   - 키에 할당량 제한이 설정됨

3. **과도한 사용**
   - 이전 수집 작업에서 할당량 소진
   - 여러 스크립트 동시 실행

## 💡 해결 방안

### 즉시 해결 방법

1. **API 키 할당량 확인**
   ```bash
   npx tsx scripts/test-api-keys.ts
   ```

2. **Google Cloud Console 확인**
   - https://console.cloud.google.com/apis/credentials
   - 할당량 탭에서 일일 사용량 확인
   - 할당량 증가 요청

3. **새로운 API 키 추가**
   - Google Cloud Console에서 새 프로젝트 생성
   - YouTube Data API v3 활성화
   - 새 API 키 생성 및 추가

### 장기 해결 방법

1. **할당량 관리 개선**
   - API 키별 사용량 추적
   - 할당량 소진 시 자동 전환
   - 일일 할당량 제한 설정

2. **수집 전략 개선**
   - 배치 크기 최적화
   - 불필요한 API 호출 제거
   - 캐싱 활용

3. **다중 프로젝트 활용**
   - 여러 Google Cloud 프로젝트 생성
   - 각 프로젝트별 API 키 사용
   - 할당량 분산

## 📋 다음 단계

1. API 키 상태 확인 완료
2. 할당량 문제 해결
3. 수집 스크립트 재실행


