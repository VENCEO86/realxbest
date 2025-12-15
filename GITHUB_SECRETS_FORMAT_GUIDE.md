# GitHub Secrets 값 형식 가이드

## 🔍 Secrets 값 형식 확인

### 1. DATABASE_URL 형식

#### ✅ 올바른 형식
```
postgresql://username:password@host:port/database?sslmode=require
```

또는

```
postgres://username:password@host:port/database?sslmode=require
```

#### 📋 형식 설명
- **프로토콜**: `postgresql://` 또는 `postgres://`
- **사용자명**: 데이터베이스 사용자 이름
- **비밀번호**: 데이터베이스 비밀번호 (특수문자 포함 가능)
- **호스트**: 데이터베이스 서버 주소 (예: `dpg-xxxxx-a.oregon-postgres.render.com`)
- **포트**: 데이터베이스 포트 (보통 `5432`)
- **데이터베이스**: 데이터베이스 이름
- **옵션**: `?sslmode=require` (SSL 연결 필수)

#### ✅ 예시 (Render PostgreSQL)
```
postgresql://user:password123@dpg-xxxxx-a.oregon-postgres.render.com:5432/database_name?sslmode=require
```

#### ❌ 잘못된 형식
```
❌ postgresql://host:port/database  (사용자 정보 없음)
❌ postgresql://user@host/database  (비밀번호 없음)
❌ mysql://user:password@host/database  (잘못된 프로토콜)
❌ user:password@host:port/database  (프로토콜 없음)
```

#### 🔍 확인 방법
1. **프로토콜 확인**: `postgresql://` 또는 `postgres://`로 시작하는지 확인
2. **사용자 정보 확인**: `@` 기호 앞에 `username:password` 형식인지 확인
3. **데이터베이스 이름 확인**: 마지막 `/` 뒤에 데이터베이스 이름이 있는지 확인

---

### 2. YOUTUBE_API_KEYS 형식

#### ✅ 올바른 형식
```
API_KEY_1,API_KEY_2,API_KEY_3
```

#### 📋 형식 설명
- **구분자**: 쉼표(`,`)로 구분
- **키 개수**: 1개 이상 (여러 개 권장)
- **키 길이**: 보통 39자 (YouTube API 키)
- **문자**: 알파벳, 숫자, 하이픈(`-`), 언더스코어(`_`)만 사용

#### ✅ 예시
```
AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY,AIzaSyB1234567890abcdefghijklmnopqrstuvwxyz
```

#### ❌ 잘못된 형식
```
❌ AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY AIzaSyB1234567890  (공백으로 구분)
❌ AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY,  (끝에 쉼표)
❌ ,AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY  (시작에 쉼표)
❌ AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY,  (빈 값)
❌ AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY!  (특수문자 포함)
```

#### 🔍 확인 방법
1. **쉼표 구분 확인**: 키들이 쉼표로 구분되어 있는지 확인
2. **키 길이 확인**: 각 키가 30-50자 사이인지 확인
3. **특수문자 확인**: 알파벳, 숫자, 하이픈, 언더스코어만 포함하는지 확인
4. **빈 값 확인**: 쉼표 사이에 빈 값이 없는지 확인

---

## 🛠️ 로컬에서 검증하는 방법

### 1. 검증 스크립트 실행

```bash
# .env.local 파일에 Secrets 값 설정
DATABASE_URL="postgresql://user:password@host:port/database"
YOUTUBE_API_KEYS="key1,key2,key3"

# 검증 스크립트 실행
npm run verify-secrets
```

### 2. 수동 확인

#### DATABASE_URL 확인
```bash
# 환경 변수 확인
echo $DATABASE_URL

# 형식 확인
# ✅ postgresql:// 또는 postgres://로 시작
# ✅ @ 기호 포함 (사용자 정보)
# ✅ / 기호 포함 (데이터베이스 이름)
```

#### YOUTUBE_API_KEYS 확인
```bash
# 환경 변수 확인
echo $YOUTUBE_API_KEYS

# 키 개수 확인
echo $YOUTUBE_API_KEYS | tr ',' '\n' | wc -l

# 각 키 길이 확인
echo $YOUTUBE_API_KEYS | tr ',' '\n' | while read key; do echo "${#key}"; done
```

---

## 🔧 GitHub Secrets 수정 방법

### 1. Secrets 페이지 접속
- https://github.com/VENCEO86/realxbest/settings/secrets/actions

### 2. 수정할 Secret 클릭
- `DATABASE_URL` 또는 `YOUTUBE_API_KEYS` 옆의 연필 아이콘 클릭

### 3. 값 수정
- 올바른 형식으로 값 입력
- "Update secret" 버튼 클릭

---

## ⚠️ 주의사항

### DATABASE_URL
1. **비밀번호 특수문자**: URL 인코딩 필요할 수 있음
   - 예: `@` → `%40`, `#` → `%23`, `%` → `%25`
2. **SSL 모드**: Render 등 클라우드 DB는 `?sslmode=require` 필요
3. **공백 없음**: 값에 공백이 없어야 함

### YOUTUBE_API_KEYS
1. **쉼표 뒤 공백**: 허용되지만 일관성 유지 권장
2. **키 순서**: 중요하지 않음
3. **최소 1개**: 최소 1개의 유효한 키 필요

---

## 🎯 빠른 체크리스트

### DATABASE_URL
- [ ] `postgresql://` 또는 `postgres://`로 시작
- [ ] `@` 기호 포함 (사용자 정보)
- [ ] `/` 기호 포함 (데이터베이스 이름)
- [ ] 공백 없음
- [ ] 특수문자 URL 인코딩 (필요 시)

### YOUTUBE_API_KEYS
- [ ] 쉼표로 구분
- [ ] 각 키 30-50자
- [ ] 알파벳, 숫자, 하이픈, 언더스코어만 포함
- [ ] 빈 값 없음
- [ ] 시작/끝에 쉼표 없음

