# 🚀 Render 배포 설정 가이드

## 현재 상태
✅ Render Web Service 생성 완료
✅ GitHub 저장소 연결 완료 (VENCEO86/realxbest)
⚠️  환경 변수 수정 필요

---

## 🔧 Render 설정 수정 방법

### 1. 환경 변수 설정

Render 대시보드 → **Environment** 탭 → **Edit** 버튼 클릭

#### 기존 MySQL 환경 변수 삭제:
- `MYSQL_DB` ❌ 삭제
- `MYSQL_HOST` ❌ 삭제
- `MYSQL_PASSWORD` ❌ 삭제
- `MYSQL_PORT` ❌ 삭제
- `MYSQL_USER` ❌ 삭제

#### 새 환경 변수 추가:

```
DATABASE_URL=postgresql://user:password@host:port/database
```
**중요**: Render에서 생성한 PostgreSQL 데이터베이스의 **External Connection String** 사용

```
YOUTUBE_API_KEY=your-youtube-api-key-here
```
YouTube Data API v3 키

```
YOUTUBE_API_KEYS=key1,key2,key3
```
여러 API 키를 쉼표로 구분 (선택사항)

```
NEXT_PUBLIC_BASE_URL=https://realxbest.onrender.com
```
Render에서 제공하는 배포 URL (또는 realxbest.com)

```
NODE_ENV=production
```

---

### 2. Build & Start Commands 확인

Render 대시보드 → **Settings** 탭에서 확인:

#### Build Command:
```bash
npm install && npx prisma generate && npm run build
```

#### Start Command:
```bash
npm start
```

---

### 3. PostgreSQL 데이터베이스 생성 (Render)

1. Render 대시보드 → **New +** → **PostgreSQL**
2. 설정:
   - **Name**: `realxbest-db` (또는 원하는 이름)
   - **Database**: `realxbest`
   - **Region**: Web Service와 동일한 지역
   - **Plan**: `Free` (또는 원하는 플랜)
3. 생성 후:
   - **Connection Info** → **External Connection String** 복사
   - Web Service의 `DATABASE_URL` 환경 변수에 설정

---

### 4. Prisma 마이그레이션

배포 후 Render Shell에서 실행:

```bash
npx prisma db push
```

또는 로컬에서 실행 (DATABASE_URL 환경 변수 설정 후):

```bash
cd d:\realxbest
npx prisma db push
```

---

## 📋 체크리스트

- [ ] MySQL 환경 변수 삭제
- [ ] DATABASE_URL 추가 (PostgreSQL)
- [ ] YOUTUBE_API_KEY 추가
- [ ] YOUTUBE_API_KEYS 추가 (선택사항)
- [ ] NEXT_PUBLIC_BASE_URL 추가
- [ ] NODE_ENV=production 추가
- [ ] Build Command 확인
- [ ] Start Command 확인
- [ ] PostgreSQL 데이터베이스 생성
- [ ] Prisma 마이그레이션 실행
- [ ] 배포 테스트

---

## ⚠️ 중요 사항

1. **DATABASE_URL**: Render PostgreSQL의 External Connection String 사용
2. **API 키**: YouTube API 키는 Render 환경 변수로만 관리 (Git에 포함하지 않음)
3. **도메인**: realxbest.com이 설정되어 있다면 SSL 인증서 자동 발급됨
4. **첫 배포**: 5-10분 소요 가능

---

## 🔍 문제 해결

### 빌드 실패 시
- 로그 확인: Render 대시보드 → **Logs** 탭
- 환경 변수 확인
- Build Command 확인

### 데이터베이스 연결 실패 시
- DATABASE_URL 형식 확인
- PostgreSQL 데이터베이스가 실행 중인지 확인
- External Connection String 사용 확인

### API 키 오류 시
- YOUTUBE_API_KEY 환경 변수 확인
- YouTube API 쿼터 확인

