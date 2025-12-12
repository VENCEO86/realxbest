# 🚀 Render 배포 체크리스트

## ✅ 완료된 작업

1. ✅ Dockerfile 생성 (Next.js standalone 빌드)
2. ✅ .dockerignore 생성 (보안 설정)
3. ✅ next.config.mjs 업데이트 (standalone 출력)
4. ✅ package.json 업데이트 (postinstall 스크립트)
5. ✅ GitHub 푸시 완료

## 📋 Render 대시보드에서 설정해야 할 사항

### 1. 환경 변수 설정 (필수)

Render 대시보드 > Service > Environment 섹션에서 다음 환경 변수를 추가하세요:

```bash
# YouTube API 키 (다중 키 지원)
YOUTUBE_API_KEYS=AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY,AIzaSyCjxqyzAGEmC21uyXVk1loyvqeOi3fDaB4,AIzaSyBfD3EPz6DL6J_I05fgT9zt3_iyZ39DkpU

# 기본 API 키 (하위 호환성)
YOUTUBE_API_KEY=AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY

# Next.js 설정
NEXT_PUBLIC_BASE_URL=https://realxbest.com
NEXT_PUBLIC_APP_URL=https://realxbest.com

# Node.js 설정
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# 데이터베이스 (PostgreSQL 사용 시 - 선택사항)
# DATABASE_URL=postgresql://user:password@host:5432/dbname?schema=public
```

### 2. 빌드 설정 확인

- **Build Command**: 비워두기 (Dockerfile 사용)
- **Start Command**: 비워두기 (Dockerfile CMD 사용)
- **Dockerfile Path**: `./Dockerfile`

### 3. 자동 배포 확인

- GitHub 저장소 연결 확인
- Branch: `main`
- Auto-Deploy: 활성화

## 🔍 배포 후 확인 사항

1. **배포 로그 확인**
   - Render 대시보드 > Logs에서 빌드 및 실행 로그 확인
   - 오류가 있으면 로그에서 확인

2. **API 연동 테스트**
   - `https://realxbest.com/api/rankings` 접속하여 데이터 확인
   - YouTube API 키가 정상 작동하는지 확인

3. **프론트엔드 확인**
   - `https://realxbest.com` 접속하여 페이지 로드 확인
   - 랭킹 데이터가 표시되는지 확인

## ⚠️ 문제 해결

### Dockerfile 빌드 실패
- 로컬에서 `npm run build` 성공하는지 확인
- Prisma generate가 정상 작동하는지 확인

### 환경 변수 오류
- 모든 필수 환경 변수가 설정되었는지 확인
- API 키 형식이 올바른지 확인 (쉼표로 구분)

### 데이터베이스 연결 실패
- DATABASE_URL이 설정되지 않아도 Mock 데이터로 작동 가능
- 실제 DB가 필요하면 Render PostgreSQL 서비스 생성 후 연결

### API 데이터가 안 나올 때
- YouTube API 키 할당량 확인
- API 키가 YouTube Data API v3에 제한되어 있는지 확인

## 📝 다음 단계

1. Render 대시보드에서 환경 변수 설정
2. 자동 배포 시작 대기 (몇 분 소요)
3. 배포 완료 후 사이트 접속하여 테스트
4. API 엔드포인트 테스트하여 데이터 수신 확인
