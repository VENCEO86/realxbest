# 🔧 Render 데이터베이스 문제 해결 가이드

## ❌ 문제 증상

- 웹사이트에서 데이터가 제대로 표시되지 않음
- 파일이 전체가 안 나옴
- Render 배포 후 데이터베이스 연결 문제

---

## 🔍 가능한 원인

### 1. Prisma Client 생성 문제

**증상**:
- Prisma Client가 제대로 생성되지 않음
- 엔진 바이너리가 누락됨

**확인 방법**:
```bash
# Render 로그에서 확인
ls -la /app/node_modules/.prisma/client/
ls -la /app/node_modules/@prisma/client/
find /app/node_modules/.prisma -name "query-engine-*"
```

**해결 방법**:
- Dockerfile에서 Prisma Client 생성 확인
- 엔진 바이너리 복사 확인

### 2. 데이터베이스 연결 문제

**증상**:
- 데이터베이스 연결 실패
- 환경 변수 누락

**확인 방법**:
1. Render 대시보드 → Environment 탭
2. `DATABASE_URL` 환경 변수 확인
3. PostgreSQL 서비스 상태 확인

**해결 방법**:
- `DATABASE_URL` 환경 변수 설정 확인
- PostgreSQL 서비스가 실행 중인지 확인
- 연결 문자열 형식 확인: `postgresql://user:password@host:port/database`

### 3. 데이터베이스 스키마 동기화 문제

**증상**:
- 테이블이 없음
- 스키마가 동기화되지 않음

**확인 방법**:
```bash
# Render 로그에서 확인
npx prisma db pull
npx prisma migrate status
```

**해결 방법**:
- Render에서 수동으로 마이그레이션 실행
- 또는 `prisma db push` 실행

### 4. 환경 변수 문제

**증상**:
- 환경 변수가 설정되지 않음
- 런타임에서 환경 변수를 읽을 수 없음

**확인 방법**:
1. Render 대시보드 → Environment 탭
2. 필요한 환경 변수 확인:
   - `DATABASE_URL`
   - `NODE_ENV=production`
   - 기타 필요한 변수

**해결 방법**:
- 환경 변수 설정 확인
- 재배포 후 확인

---

## 🛠️ 해결 단계

### 1단계: Render 로그 확인

1. Render 대시보드 접속
2. `realxbest` 서비스 선택
3. **Logs** 탭 클릭
4. 다음 오류 메시지 확인:
   - `Prisma Client could not locate the Query Engine`
   - `Can't reach database server`
   - `Environment variable not found`
   - `Table does not exist`

### 2단계: 환경 변수 확인

1. Render 대시보드 → **Environment** 탭
2. 다음 환경 변수 확인:
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   NODE_ENV=production
   ```

### 3단계: 데이터베이스 연결 확인

1. PostgreSQL 서비스 상태 확인
2. 연결 문자열 형식 확인
3. 네트워크 연결 확인

### 4단계: Prisma 스키마 동기화

**옵션 1: Render에서 수동 실행**

1. Render 대시보드 → **Shell** 탭 (또는 SSH)
2. 다음 명령어 실행:
   ```bash
   npx prisma db push
   ```

**옵션 2: 로컬에서 실행**

1. 로컬에서 `.env.local` 파일에 `DATABASE_URL` 설정
2. 다음 명령어 실행:
   ```bash
   npx prisma db push
   ```

### 5단계: 재배포

1. 변경사항 커밋 및 푸시
2. Render에서 수동 배포
3. 배포 로그 확인

---

## 🔍 디버깅 명령어

### Render 로그에서 확인할 명령어

```bash
# Prisma Client 확인
ls -la /app/node_modules/.prisma/client/
ls -la /app/node_modules/@prisma/client/

# 엔진 바이너리 확인
find /app/node_modules/.prisma -name "query-engine-*"
find /app/node_modules/@prisma -name "query-engine-*"

# 환경 변수 확인
echo $DATABASE_URL
env | grep DATABASE

# 데이터베이스 연결 테스트
npx prisma db pull
npx prisma migrate status
```

---

## 📋 체크리스트

### 배포 전 확인

- [ ] `DATABASE_URL` 환경 변수 설정됨
- [ ] PostgreSQL 서비스 실행 중
- [ ] Prisma 스키마 최신 상태
- [ ] Dockerfile에서 Prisma Client 생성 확인

### 배포 후 확인

- [ ] 배포 로그에 오류 없음
- [ ] Prisma Client 생성 성공
- [ ] 데이터베이스 연결 성공
- [ ] 웹사이트에서 데이터 표시됨

### 문제 발생 시

- [ ] Render 로그 확인
- [ ] 환경 변수 확인
- [ ] 데이터베이스 연결 확인
- [ ] Prisma 스키마 동기화 확인

---

## 💡 빠른 해결 방법

### 방법 1: 환경 변수 재설정

1. Render 대시보드 → Environment 탭
2. `DATABASE_URL` 삭제 후 재추가
3. 재배포

### 방법 2: 데이터베이스 스키마 동기화

1. 로컬에서 `.env.local`에 `DATABASE_URL` 설정
2. `npx prisma db push` 실행
3. 재배포

### 방법 3: 완전 재배포

1. Render에서 서비스 삭제
2. 새로 생성
3. 환경 변수 설정
4. 배포

---

## 🎯 예상 해결 시간

- 환경 변수 문제: 5분
- 스키마 동기화: 10분
- Prisma Client 문제: 15분
- 완전 재배포: 30분

---

## 📞 추가 도움

문제가 계속되면:
1. Render 로그 전체 복사
2. 환경 변수 설정 확인
3. 데이터베이스 연결 상태 확인
4. Prisma 스키마 확인

