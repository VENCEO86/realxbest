# 🚀 자동 수집 시스템 가이드

## ✅ 완료된 기능

### 1. 데일리 자동 수집 시스템
- **목표**: 국가별/카테고리별 최소 300명 이상 확보
- **속도 최적화**: 배치 처리 및 병렬 검색
- **API 할당량 관리**: 다중 키 지원 및 자동 전환

### 2. 데이터베이스 자동 설정
- 카테고리 자동 생성
- 초기 데이터 설정

### 3. 자동화 옵션
- Render Cron Job 지원
- GitHub Actions 지원
- 수동 실행 가능

## 📋 사용 방법

### 방법 1: 수동 실행 (테스트용)

```bash
# DB 설정
npm run db:setup

# 데일리 수집 실행
npm run collect:daily
```

### 방법 2: Render Cron Job (권장)

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

### 방법 3: GitHub Actions (자동)

`.github/workflows/daily-collect.yml` 파일이 자동으로 설정됩니다.

**필요한 GitHub Secrets:**
- `DATABASE_URL`
- `YOUTUBE_API_KEYS`

## 🎯 수집 목표

- **국가별/카테고리별**: 최소 300명 이상
- **최소 구독자**: 1,000명 이상
- **최소 조회수**: 10,000회 이상
- **자동 중복 제거**: 기존 채널은 업데이트만 수행

## ⚡ 속도 최적화

1. **배치 처리**: 채널 상세 정보를 50개씩 배치로 가져옴
2. **다중 키 지원**: API 키 자동 전환으로 할당량 분산
3. **할당량 관리**: 키당 일일 할당량 자동 추적
4. **Rate Limiting**: API 제한 준수

## 📊 진행 상황 확인

수집 진행 중:
- 현재 진행률 표시
- 국가별/카테고리별 상태 표시
- 수집/저장 통계 표시

## 🔧 문제 해결

### API 할당량 소진
- 자동으로 다음 키로 전환
- 모든 키 소진 시 중단

### 데이터베이스 오류
- 연결 재시도
- 오류 로그 출력

### 수집 속도가 느림
- API 키 추가로 속도 향상 가능
- 할당량 확인 필요


