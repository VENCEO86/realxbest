# GitHub Actions 실패 원인 분석 및 해결 가이드

## 🔍 발견된 문제점

### 현재 상황
- **모든 워크플로우 실행 실패** (빨간 X)
- **실행 시간: 10-31초** (정상 실행 시 10-30분 소요)
- **결론**: 초기 단계에서 조기 실패

### 가능한 원인

1. **환경 변수 누락** (가장 가능성 높음)
   - `DATABASE_URL`이 GitHub Secrets에 없음
   - `YOUTUBE_API_KEYS`가 GitHub Secrets에 없음

2. **의존성 설치 실패**
   - `npm ci --legacy-peer-deps` 실패
   - Node.js 버전 호환성 문제

3. **Prisma 생성 실패**
   - `DATABASE_URL` 형식 오류
   - Prisma 스키마 오류

4. **데이터베이스 연결 실패**
   - `DATABASE_URL`이 잘못됨
   - 데이터베이스 서버 접근 불가

5. **스크립트 실행 전 오류**
   - 환경 변수 체크에서 실패
   - 스크립트 파일 경로 오류

## ✅ 적용된 해결 방안

### 1. 환경 변수 검증 단계 추가
```yaml
- name: Verify environment variables
  run: |
    if [ -z "${{ secrets.DATABASE_URL }}" ]; then
      echo "❌ ERROR: DATABASE_URL is not set"
      exit 1
    fi
    if [ -z "${{ secrets.YOUTUBE_API_KEYS }}" ]; then
      echo "❌ ERROR: YOUTUBE_API_KEYS is not set"
      exit 1
    fi
```

### 2. 데이터베이스 연결 검증 단계 추가
```yaml
- name: Verify database connection
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: |
    npx tsx -e "
      import { PrismaClient } from '@prisma/client';
      const prisma = new PrismaClient();
      prisma.\$connect()
        .then(() => {
          console.log('✅ Database connection successful');
          return prisma.\$disconnect();
        })
        .catch((error) => {
          console.error('❌ Database connection failed:', error.message);
          process.exit(1);
        });
    "
```

### 3. 각 단계별 에러 핸들링 강화
- 각 단계에서 실패 시 즉시 종료
- 명확한 에러 메시지 출력
- 디버깅 정보 추가

## 🔧 GitHub Secrets 확인 방법

### 1. Secrets 페이지 접속
1. GitHub 저장소 접속
2. **Settings** 탭 클릭
3. 왼쪽 사이드바에서 **Secrets and variables** > **Actions** 클릭

### 2. 필수 Secrets 확인
다음 Secrets가 존재하는지 확인:
- ✅ `DATABASE_URL` - 데이터베이스 연결 URL
- ✅ `YOUTUBE_API_KEYS` - YouTube API 키 (쉼표로 구분)

### 3. Secrets 추가/수정
- Secrets가 없으면 **New repository secret** 버튼 클릭
- 이름과 값을 입력하여 추가

## 📋 실행 로그 확인 방법

### 1. 워크플로우 실행 페이지 접속
- https://github.com/VENCEO86/realxbest/actions/workflows/daily-collect.yml

### 2. 최신 실행 클릭
- 실패한 실행 항목 클릭

### 3. "collect" job 클릭
- 왼쪽 사이드바에서 "collect" job 클릭

### 4. 각 단계별 로그 확인
- 각 단계를 클릭하여 상세 로그 확인
- 에러 메시지 확인

## 🎯 예상되는 에러 메시지

### 환경 변수 누락
```
❌ ERROR: DATABASE_URL is not set in GitHub Secrets
❌ ERROR: YOUTUBE_API_KEYS is not set in GitHub Secrets
```
**해결**: GitHub Secrets에 추가

### 데이터베이스 연결 실패
```
❌ Database connection failed: [에러 메시지]
```
**해결**: DATABASE_URL 형식 확인 및 데이터베이스 서버 접근 확인

### 의존성 설치 실패
```
❌ ERROR: Failed to install dependencies
```
**해결**: package.json 확인 및 의존성 문제 해결

## 🚀 다음 단계

1. **GitHub Secrets 확인**
   - Settings > Secrets and variables > Actions
   - 필수 Secrets 존재 여부 확인

2. **워크플로우 다시 실행**
   - Actions 탭에서 "Run workflow" 클릭
   - 실행 로그 확인

3. **에러 메시지 확인**
   - 각 단계별 로그 확인
   - 에러 메시지에 따라 조치

4. **문제 해결**
   - 환경 변수 누락 → Secrets 추가
   - 데이터베이스 연결 실패 → DATABASE_URL 확인
   - 의존성 설치 실패 → package.json 확인


