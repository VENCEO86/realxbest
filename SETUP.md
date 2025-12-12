# 프로젝트 설정 가이드

## 1. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/korxyoutube?schema=public"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# YouTube API (선택사항)
YOUTUBE_API_KEY="your-youtube-api-key"

# Redis (선택사항, 캐싱용)
REDIS_URL="redis://localhost:6379"
```

## 2. 데이터베이스 설정

### PostgreSQL 설치 및 데이터베이스 생성

```bash
# PostgreSQL이 설치되어 있다면
createdb korxyoutube

# 또는 psql에서
psql -U postgres
CREATE DATABASE korxyoutube;
```

### Prisma 마이그레이션

```bash
# Prisma 클라이언트 생성
npm run db:generate

# 데이터베이스 스키마 적용
npm run db:push

# 또는 마이그레이션 생성 (프로덕션 환경)
npm run db:migrate
```

## 3. 초기 데이터 설정 (선택사항)

데이터베이스에 초기 카테고리 데이터를 추가하려면:

```sql
-- 카테고리 데이터 삽입
INSERT INTO categories (id, name, "nameEn", "createdAt", "updatedAt") VALUES
  ('cat1', '엔터테인먼트', 'Entertainment', NOW(), NOW()),
  ('cat2', '음악', 'Music', NOW(), NOW()),
  ('cat3', '교육', 'Education', NOW(), NOW()),
  ('cat4', '게임', 'Gaming', NOW(), NOW()),
  ('cat5', '스포츠', 'Sports', NOW(), NOW()),
  ('cat6', '뉴스/정치', 'News/Politics', NOW(), NOW()),
  ('cat7', '인물/블로그', 'People/Blog', NOW(), NOW()),
  ('cat8', '노하우/스타일', 'Howto/Style', NOW(), NOW()),
  ('cat9', '기타', 'Other', NOW(), NOW());
```

또는 Prisma Studio를 사용하여 데이터를 추가할 수 있습니다:

```bash
npm run db:studio
```

## 4. 개발 서버 실행

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 5. YouTube API 연동 (선택사항)

YouTube Data API v3를 사용하여 채널 데이터를 수집하려면:

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. YouTube Data API v3 활성화
3. API 키 생성
4. `.env` 파일에 `YOUTUBE_API_KEY` 추가

## 6. 프로덕션 빌드

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## 문제 해결

### Prisma 오류
- `DATABASE_URL`이 올바른지 확인
- PostgreSQL이 실행 중인지 확인
- `npm run db:generate` 실행

### 포트 충돌
- 기본 포트 3000이 사용 중이면 `package.json`의 `dev` 스크립트를 수정:
  ```json
  "dev": "next dev -p 3001"
  ```

### 이미지 최적화 오류
- `next.config.ts`의 `remotePatterns`에 이미지 도메인 추가



