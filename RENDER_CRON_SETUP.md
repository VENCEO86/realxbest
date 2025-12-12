# Render Cron Job 설정 가이드

## 데일리 자동 채널 수집 설정

### 1. Render Cron Job 생성

1. Render 대시보드 접속
2. **New +** → **Cron Job** 선택
3. 설정:
   - **Name**: `daily-channel-collector`
   - **Schedule**: `0 18 * * *` (매일 UTC 18시 = 한국시간 오전 3시)
   - **Command**: `bash scripts/render-cron-job.sh`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`

### 2. 환경 변수 설정

Cron Job에도 동일한 환경 변수 설정:
- `DATABASE_URL`
- `YOUTUBE_API_KEYS`
- `YOUTUBE_API_KEY`
- `NODE_ENV=production`

### 3. 또는 GitHub Actions 사용 (권장)

`.github/workflows/daily-collect.yml` 파일이 자동으로 설정됨.

**설정 방법:**
1. GitHub 저장소 → Settings → Secrets and variables → Actions
2. 다음 Secrets 추가:
   - `DATABASE_URL`: PostgreSQL 연결 문자열
   - `YOUTUBE_API_KEYS`: YouTube API 키들 (쉼표로 구분)

3. 자동 실행:
   - 매일 한국시간 오전 3시 자동 실행
   - 또는 수동으로 "Run workflow" 클릭

## 목표

- 국가별/카테고리별 최소 300명 이상 확보
- 데일리로 자동 수집
- API 할당량 최적화
- 속도 개선 (배치 처리)

