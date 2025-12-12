# KorYouTube - 유튜브 랭킹 & 분석 플랫폼

유튜브 채널 랭킹 및 분석을 위한 하이브리드 웹 플랫폼입니다.

## 기능

- ✅ 유튜브 채널 랭킹 (다양한 정렬 기준)
- ✅ 채널 상세 분석 (성장 추이, 최근 동영상)
- ✅ 카테고리별 분석
- ✅ 광고 관리자 (빌더 형태)
- ✅ 픽셀 광고 지원
- ✅ SEO 최적화

## 기술 스택

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Prisma ORM)
- **State Management**: Zustand, React Query
- **Charts**: Recharts

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/korxyoutube?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
YOUTUBE_API_KEY="your-youtube-api-key"
```

### 3. 데이터베이스 설정

```bash
# Prisma 클라이언트 생성
npm run db:generate

# 데이터베이스 마이그레이션
npm run db:push

# 또는 마이그레이션 생성
npm run db:migrate
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로젝트 구조

```
korxyoutube/
├── app/                    # Next.js App Router
│   ├── api/               # API 라우트
│   ├── admin/             # 관리자 페이지
│   ├── channels/          # 채널 상세 페이지
│   └── page.tsx           # 메인 페이지
├── components/            # React 컴포넌트
│   ├── admin/            # 광고 관리자 컴포넌트
│   ├── ads/              # 광고 관련 컴포넌트
│   ├── channel/          # 채널 관련 컴포넌트
│   ├── layout/           # 레이아웃 컴포넌트
│   └── ranking/          # 랭킹 관련 컴포넌트
├── lib/                   # 유틸리티 함수
├── prisma/               # Prisma 스키마
└── public/               # 정적 파일
```

## 주요 기능

### 랭킹 페이지
- 카테고리별 필터링
- 다양한 정렬 기준 (구독자, 조회수, 성장률 등)
- 페이지네이션

### 채널 상세 페이지
- 채널 기본 정보
- 성장 추이 차트
- 최근 동영상 리스트
- 인사이트 분석

### 광고 관리자
- 빌더 형태의 광고 생성
- 다양한 광고 타입 지원 (배너, 네이티브, 픽셀 등)
- 페이지별, 위치별 배치
- 성과 분석

## 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# Prisma Studio (데이터베이스 GUI)
npm run db:studio
```

## 라이선스

MIT



