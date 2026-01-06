# 🔍 프로덕션 데이터 불일치 문제 해결 가이드

## ❌ 문제 증상

- 로컬에서는 데이터가 정상적으로 표시됨
- 프로덕션(https://realxbest.com/)에서는 데이터가 제대로 표시되지 않음
- "데이터를 불러오는 중..." 메시지가 계속 표시됨

---

## 🔍 가능한 원인

### 1. 데이터베이스 연결 실패

**증상**:
- API가 Mock 데이터를 반환함
- 실제 데이터베이스 데이터가 표시되지 않음

**확인 방법**:
- Render 로그에서 "Database connection error" 확인
- "Using mock data" 메시지 확인

**해결 방법**:
- `DATABASE_URL` 환경 변수 확인
- PostgreSQL 서비스 상태 확인

### 2. Prisma Client 오류

**증상**:
- OpenSSL 라이브러리 오류
- Prisma 엔진을 찾을 수 없음

**확인 방법**:
- Render 로그에서 Prisma 오류 확인
- "Error loading shared library libssl.so.1.1" 확인

**해결 방법**:
- Dockerfile에서 OpenSSL 라이브러리 설치 확인
- Prisma binaryTargets 확인

### 3. API 엔드포인트 오류

**증상**:
- API 요청이 실패함
- 500 에러 또는 타임아웃

**확인 방법**:
- 브라우저 개발자 도구 → Network 탭
- `/api/rankings` 요청 상태 확인

**해결 방법**:
- API 로그 확인
- 오류 메시지 확인

### 4. 환경 변수 문제

**증상**:
- `DATABASE_URL`이 설정되지 않음
- 환경 변수를 읽을 수 없음

**확인 방법**:
- Render 대시보드 → Environment 탭
- `DATABASE_URL` 확인

**해결 방법**:
- 환경 변수 재설정
- 재배포

---

## 🛠️ 해결 단계

### 1단계: Render 로그 확인

1. Render 대시보드 접속
2. `realxbest` 서비스 선택
3. **Logs** 탭 클릭
4. 다음 메시지 확인:
   - `✅ [Prisma] 데이터베이스 연결 성공`
   - `❌ [Prisma] 데이터베이스 연결 실패`
   - `✅ [Rankings API] 데이터베이스 연결 성공`
   - `❌ [Rankings API] 데이터베이스 연결 실패`
   - `⚠️ [Rankings API] Mock 데이터 사용 중`

### 2단계: 환경 변수 확인

1. Render 대시보드 → **Environment** 탭
2. `DATABASE_URL` 확인:
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   ```
3. 형식이 올바른지 확인

### 3단계: 데이터베이스 연결 테스트

**Render Shell에서 테스트**:
```bash
# Prisma Client 생성
npx prisma generate

# 데이터베이스 연결 테스트
npx prisma db pull

# 데이터 확인
npx prisma studio
```

### 4단계: API 엔드포인트 테스트

**브라우저에서 직접 테스트**:
```
https://realxbest.com/api/rankings
```

**예상 응답**:
```json
{
  "channels": [...],
  "total": 4722,
  "page": 1,
  "limit": 1000
}
```

**오류 응답**:
```json
{
  "channels": [],
  "total": 0,
  "error": "데이터 조회 중 오류가 발생했습니다."
}
```

---

## 🔍 디버깅 명령어

### Render 로그에서 확인할 메시지

**성공 메시지**:
```
✅ [Prisma] 데이터베이스 연결 성공
✅ [Rankings API] 데이터베이스 연결 성공
✅ [Rankings API] 채널 조회 완료: 4722개
✅ [Rankings API] 데이터 조회 완료: 1000개 채널, 총 4722개
```

**오류 메시지**:
```
❌ [Prisma] 데이터베이스 연결 실패: ...
❌ [Rankings API] 데이터베이스 연결 실패: ...
❌ [Rankings API] 채널 조회 실패: ...
⚠️ [Rankings API] Mock 데이터 사용 중 (데이터베이스 연결 실패)
```

---

## 📋 체크리스트

### 배포 전 확인

- [ ] `DATABASE_URL` 환경 변수 설정됨
- [ ] PostgreSQL 서비스 실행 중
- [ ] Prisma 스키마 최신 상태
- [ ] Dockerfile에서 OpenSSL 라이브러리 설치 확인

### 배포 후 확인

- [ ] 배포 로그에 오류 없음
- [ ] Prisma Client 생성 성공
- [ ] 데이터베이스 연결 성공
- [ ] API 엔드포인트 정상 작동
- [ ] 웹사이트에서 데이터 표시됨

### 문제 발생 시

- [ ] Render 로그 확인
- [ ] 환경 변수 확인
- [ ] 데이터베이스 연결 확인
- [ ] API 엔드포인트 테스트
- [ ] 브라우저 개발자 도구 확인

---

## 💡 빠른 해결 방법

### 방법 1: 환경 변수 재설정

1. Render 대시보드 → Environment 탭
2. `DATABASE_URL` 삭제 후 재추가
3. 재배포

### 방법 2: 데이터베이스 연결 확인

1. Render Shell에서 실행:
   ```bash
   npx prisma db pull
   ```
2. 연결 성공 여부 확인

### 방법 3: 완전 재배포

1. Render에서 서비스 삭제
2. 새로 생성
3. 환경 변수 설정
4. 배포

---

## 🎯 예상 해결 시간

- 환경 변수 문제: 5분
- 데이터베이스 연결 문제: 10분
- Prisma Client 문제: 15분
- 완전 재배포: 30분

---

## 📞 추가 도움

문제가 계속되면:
1. Render 로그 전체 복사
2. 브라우저 개발자 도구 → Network 탭 스크린샷
3. API 응답 확인
4. 환경 변수 설정 확인

