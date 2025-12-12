# Render 배포 가이드

## 필수 환경 변수 설정

Render 대시보드에서 다음 환경 변수를 설정해야 합니다:

### 1. YouTube API 키
```
YOUTUBE_API_KEYS=your_api_key_1,your_api_key_2,your_api_key_3
YOUTUBE_API_KEY=your_api_key_1
```

### 2. Next.js 설정
```
NEXT_PUBLIC_BASE_URL=https://realxbest.com
NEXT_PUBLIC_APP_URL=https://realxbest.com
```

### 3. 데이터베이스 (PostgreSQL 사용 시)
```
DATABASE_URL=postgresql://user:password@host:5432/dbname?schema=public
```

### 4. 기타
```
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

## 배포 단계

1. **GitHub에 푸시**
   ```bash
   git add .
   git commit -m "feat: Add Dockerfile and Render deployment config"
   git push origin main
   ```

2. **Render 대시보드에서 환경 변수 설정**
   - Service > Environment 섹션에서 위의 환경 변수들 추가

3. **자동 배포 확인**
   - GitHub에 푸시하면 Render가 자동으로 배포를 시작합니다
   - 배포 로그에서 오류 확인

## 문제 해결

### Dockerfile 빌드 실패
- `npm run build`가 로컬에서 성공하는지 확인
- Prisma generate가 정상 작동하는지 확인

### 환경 변수 오류
- 모든 필수 환경 변수가 설정되었는지 확인
- API 키가 올바른지 확인

### 데이터베이스 연결 실패
- DATABASE_URL이 올바른지 확인
- Render PostgreSQL 서비스가 생성되었는지 확인


