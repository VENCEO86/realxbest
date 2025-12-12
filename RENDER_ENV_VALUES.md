# 🔐 Render 환경 변수 설정 값

## ✅ 자동 설정 완료된 항목

### MySQL 환경 변수 삭제 완료
- ✅ MYSQL_DB 삭제됨
- ✅ MYSQL_HOST 삭제됨  
- ✅ MYSQL_PASSWORD 삭제됨
- ✅ MYSQL_PORT 삭제됨
- ✅ MYSQL_USER 삭제됨

---

## 📝 Render 대시보드에서 수동으로 설정할 값

Render 대시보드 → realxbest 서비스 → Environment → "+ Add" 클릭

### 1. DATABASE_URL
**Key**: `DATABASE_URL`  
**Value**: `postgresql://user:password@host:port/database`

**설정 방법**:
1. Render 대시보드 → **New +** → **PostgreSQL** 클릭
2. 데이터베이스 생성:
   - Name: `realxbest-db`
   - Database: `realxbest`
   - Region: Web Service와 동일
   - Plan: Free (또는 원하는 플랜)
3. 생성 후:
   - 데이터베이스 선택 → **Connection Info** 클릭
   - **External Connection String** 복사
   - 이 값을 DATABASE_URL에 입력

**예시**:
```
postgresql://realxbest_user:abc123@dpg-xxxxx-a.oregon-postgres.render.com/realxbest
```

---

### 2. YOUTUBE_API_KEY
**Key**: `YOUTUBE_API_KEY`  
**Value**: `AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY`

**참고**: 로컬 .env.local 파일에서 확인한 키입니다.

---

### 3. YOUTUBE_API_KEYS (선택사항)
**Key**: `YOUTUBE_API_KEYS`  
**Value**: `AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY,AIzaSyCjxqyzAGEmC21uyXVk1loyvqeOi3fDaB4,AIzaSyBfD3EPz6DL6J_I05fgT9zt3_iyZ39DkpU`

여러 API 키를 쉼표로 구분하여 입력 (API 쿼터 증가용)

---

### 4. NEXT_PUBLIC_BASE_URL
**Key**: `NEXT_PUBLIC_BASE_URL`  
**Value**: `https://realxbest.onrender.com`

또는 도메인이 설정되어 있다면: `https://realxbest.com`

---

### 5. NODE_ENV
**Key**: `NODE_ENV`  
**Value**: `production`

---

## 📋 설정 순서

1. ✅ MySQL 환경 변수 삭제 (완료)
2. ⏳ PostgreSQL 데이터베이스 생성
3. ⏳ DATABASE_URL 설정
4. ⏳ YOUTUBE_API_KEY 설정
5. ⏳ YOUTUBE_API_KEYS 설정 (선택사항)
6. ⏳ NEXT_PUBLIC_BASE_URL 설정
7. ⏳ NODE_ENV 설정
8. ⏳ Build & Start Commands 확인
9. ⏳ 배포 실행

---

## 🔍 Build & Start Commands 확인

Render 대시보드 → Settings 탭에서 확인:

**Build Command**:
```bash
npm install && npx prisma generate && npm run build
```

**Start Command**:
```bash
npm start
```

---

## 💡 참고사항

- 환경 변수 설정 후 자동으로 재배포가 시작됩니다
- 첫 배포는 5-10분 정도 소요될 수 있습니다
- 배포 완료 후 https://realxbest.onrender.com 에서 확인 가능합니다

