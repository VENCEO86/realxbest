# 🔑 여러 API 키 사용 가이드

## 문제
YouTube API 무료 할당량은 **하루 10,000 units**입니다.
- 32개국 수집 시 이미 쿼터 소진
- 나머지 42개국 수집 불가

## 해결 방법: 여러 API 키 사용

### 방법 1: 여러 Google 계정으로 API 키 발급 (무료, 추천)

**장점:**
- 완전 무료
- 각 계정마다 10,000 units 할당량
- 3개 키 = 30,000 units (충분함)

**단계:**

1. **추가 Google 계정 생성** (또는 기존 계정 사용)
   - Gmail 계정 2-3개 준비
   - 각 계정마다 Google Cloud Console 접속

2. **각 계정에서 API 키 발급**
   - https://console.cloud.google.com/
   - 프로젝트 생성
   - YouTube Data API v3 활성화
   - API 키 생성

3. **환경 변수 자동 설정** (추천)

   **방법 A: 대화형 설정 (가장 쉬움)**
   ```bash
   npm run setup-api-keys-interactive
   ```
   - 단계별로 API 키 입력
   - 자동으로 환경 변수 설정
   - 할당량 계산 및 확인

   **방법 B: 한 번에 입력**
   ```bash
   npm run setup-api-keys
   ```
   - 모든 키를 쉼표로 구분하여 한 번에 입력
   - 예: `키1,키2,키3`

   **방법 C: 수동 설정**
   ```powershell
   # 여러 API 키를 쉼표로 구분하여 설정
   $env:YOUTUBE_API_KEYS="키1,키2,키3"
   ```

   **또는 .env 파일:**
   ```env
   YOUTUBE_API_KEYS=AIzaSy...키1,AIzaSy...키2,AIzaSy...키3
   ```

4. **스크립트 실행**
   ```bash
   npm run collect-country-channels
   ```

### 방법 2: 유료 플랜 업그레이드

**비용:**
- 월 $50 이상 (최소 결제)
- $0.60 per 1,000 units
- 100,000 units = $60/월

**단계:**

1. Google Cloud Console 접속
2. "청구" > "결제 계정 연결"
3. 신용카드 등록
4. "할당량 증가 요청" 제출
5. 승인 대기 (보통 1-2일)

### 방법 3: 쿼터 최적화

**현재 스크립트 개선:**
- 불필요한 API 호출 제거
- 캐싱 활용
- 배치 처리 최적화

---

## 빠른 해결 (오늘 바로)

**추천: 방법 1 (여러 API 키)**

1. **추가 Google 계정 2개 준비**
   - 기존 Gmail 계정 사용 가능
   - 또는 새로 생성 (5분 소요)

2. **각 계정에서 API 키 발급** (계정당 5분)
   - 총 15분 소요

3. **환경 변수 설정**
   ```powershell
   $env:YOUTUBE_API_KEYS="기존키,새키1,새키2"
   ```

4. **스크립트 재실행**
   ```bash
   npm run collect-country-channels
   ```

**예상 결과:**
- 3개 키 = 30,000 units
- 74개국 모두 수집 가능
- 약 1-2시간 소요

---

## 현재 스크립트 기능

✅ **자동 API 키 순환**
- 여러 키를 자동으로 순환 사용
- 쿼터 초과 시 다음 키로 자동 전환

✅ **에러 처리**
- 403 오류 시 자동 재시도
- 다음 키로 자동 전환

✅ **진행 상황 표시**
- 사용 중인 키 표시
- 남은 할당량 추적

---

## 주의사항

⚠️ **API 키 보안**
- `.env` 파일을 `.gitignore`에 추가
- API 키를 공개 저장소에 올리지 않기

⚠️ **쿼터 관리**
- 각 키의 사용량 모니터링
- Google Cloud Console에서 확인 가능

