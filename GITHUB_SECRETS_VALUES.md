# GitHub Secrets 값 입력 가이드

## 🔐 1. DATABASE_URL

### ✅ 올바른 형식 (복사용)

```
postgresql://username:password@host:port/database?sslmode=require
```

### 📋 실제 값 가져오는 방법

#### Render PostgreSQL에서 가져오기:

1. **Render 대시보드 접속**
   - https://dashboard.render.com

2. **PostgreSQL 데이터베이스 선택**
   - 데이터베이스 목록에서 선택

3. **Connection Info 클릭**
   - 데이터베이스 상세 페이지에서 "Connection Info" 버튼 클릭

4. **External Connection String 복사**
   - "External Connection String" 섹션의 값을 복사
   - 형식: `postgresql://user:password@host:port/database`

5. **GitHub Secrets에 붙여넣기**
   - 위에서 복사한 값을 그대로 붙여넣기
   - `?sslmode=require` 추가 권장 (Render PostgreSQL의 경우)

### ✅ 최종 형식 예시

```
postgresql://realxbest_user:abc123xyz@dpg-xxxxx-a.oregon-postgres.render.com:5432/realxbest_db?sslmode=require
```

**중요 사항:**
- ✅ `postgresql://` 또는 `postgres://`로 시작
- ✅ `username:password@` 형식 (사용자명:비밀번호)
- ✅ `host:port/database` 형식
- ✅ Render의 경우 `?sslmode=require` 추가 권장
- ❌ 공백 없음
- ❌ 따옴표 없음 (GitHub Secrets에 입력할 때)

---

## 🔐 2. YOUTUBE_API_KEYS

### ✅ 올바른 형식 (복사용)

```
API_KEY_1,API_KEY_2,API_KEY_3
```

### 📋 실제 값 입력 방법

#### YouTube API 키 가져오기:

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com

2. **API 및 서비스 > 사용자 인증 정보**
   - 프로젝트 선택
   - "API 및 서비스" > "사용자 인증 정보" 클릭

3. **API 키 생성 또는 기존 키 확인**
   - "사용자 인증 정보 만들기" > "API 키"
   - 또는 기존 API 키 확인

4. **여러 키를 쉼표로 구분하여 입력**
   - 예: `AIzaSy...ABC,AIzaSy...XYZ,AIzaSy...123`

### ✅ 최종 형식 예시

```
AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY,AIzaSyCjxqyzAGEmC21uyXVk1loyvqeOi3fDaB4,AIzaSyBfD3EPz6DL6J_I05fgT9zt3_iyZ39DkpU
```

**중요 사항:**
- ✅ 쉼표(`,`)로 구분
- ✅ 각 키 30-50자
- ✅ 알파벳, 숫자, 하이픈(`-`), 언더스코어(`_`)만 포함
- ✅ 공백 없음 (또는 일관성 있게 공백 포함)
- ❌ 시작/끝에 쉼표 없음
- ❌ 빈 값 없음

---

## 📋 입력 체크리스트

### DATABASE_URL 입력 전 확인:
- [ ] `postgresql://` 또는 `postgres://`로 시작
- [ ] `@` 기호 포함 (사용자 정보)
- [ ] `/` 기호 포함 (데이터베이스 이름)
- [ ] 공백 없음
- [ ] 따옴표 없음

### YOUTUBE_API_KEYS 입력 전 확인:
- [ ] 쉼표로 구분
- [ ] 각 키 30-50자
- [ ] 알파벳, 숫자, 하이픈, 언더스코어만 포함
- [ ] 시작/끝에 쉼표 없음
- [ ] 빈 값 없음

---

## 🚨 주의사항

1. **DATABASE_URL**
   - 비밀번호에 특수문자가 있으면 URL 인코딩 필요할 수 있음
   - 예: `@` → `%40`, `#` → `%23`, `%` → `%25`
   - Render에서 제공하는 External Connection String을 그대로 사용하면 자동 인코딩됨

2. **YOUTUBE_API_KEYS**
   - 여러 키를 사용하면 API 할당량 증가
   - 각 키는 YouTube Data API v3 활성화 필요
   - 키 순서는 중요하지 않음

---

## 🔍 값 확인 방법

### GitHub Secrets에서 확인:
1. https://github.com/VENCEO86/realxbest/settings/secrets/actions
2. 각 Secret 옆 연필 아이콘 클릭
3. 값 확인 (보안상 일부만 표시됨)

### 로컬에서 검증:
```bash
# .env.local 파일에 값 설정
DATABASE_URL="postgresql://..."
YOUTUBE_API_KEYS="key1,key2,key3"

# 검증 스크립트 실행
npm run verify-secrets
```

