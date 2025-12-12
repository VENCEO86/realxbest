# Render Cron Job 설정 가이드

## 데일리 자동 수집 설정

### 방법 1: Render Cron Job 사용 (권장)

1. **Render 대시보드 접속**
   - https://dashboard.render.com

2. **New + > Cron Job 클릭**

3. **설정:**
   ```
   Name: daily-channel-collect
   Schedule: 0 3 * * *  (매일 오전 3시)
   Command: curl -X GET https://realxbest.com/api/cron/daily-collect -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

4. **환경 변수 추가:**
   ```
   DATABASE_URL=your-database-url
   YOUTUBE_API_KEYS=your-api-keys
   CRON_SECRET=your-secret-token
   ```

### 방법 2: GitHub Actions 사용

`.github/workflows/daily-collect.yml` 파일이 자동으로 설정됩니다.

**필요한 GitHub Secrets:**
- `DATABASE_URL`
- `YOUTUBE_API_KEYS`

### 방법 3: 수동 실행

```bash
npm run collect:daily
```

## 목표

- 국가별/카테고리별 최소 300명 이상 확보
- 데일리 자동 수집
- API 할당량 자동 관리
- 속도 최적화
