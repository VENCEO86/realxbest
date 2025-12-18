# 🤖 자동 배포 가이드

## 방법 1: Render API를 사용한 자동 설정 (권장)

### 1단계: Render API 키 생성

1. Render 대시보드 접속: https://dashboard.render.com
2. 우측 상단 프로필 클릭 > **Account Settings**
3. **API Keys** 섹션으로 이동
4. **New API Key** 클릭하여 API 키 생성
5. 생성된 API 키 복사

### 2단계: 환경 변수 자동 설정

**PowerShell에서 실행:**

```powershell
# API 키 설정
$env:RENDER_API_KEY = "your-render-api-key-here"

# 스크립트 실행
.\scripts\setup-render-env.ps1
```

**또는 Bash에서 실행:**

```bash
export RENDER_API_KEY="your-render-api-key-here"
bash scripts/setup-render-env.sh
```

### 3단계: 배포 확인

스크립트 실행 후 Render 대시보드에서:
1. 서비스 페이지로 이동: https://dashboard.render.com/web/srv-d48p38jipnbc73dkh990
2. **Environment** 섹션에서 환경 변수 확인
3. **Events** 탭에서 배포 상태 확인

---

## 방법 2: 수동 설정 (대안)

Render 대시보드에서 직접 설정:

1. **서비스 페이지 접속**
   - https://dashboard.render.com/web/srv-d48p38jipnbc73dkh990

2. **Environment 섹션으로 이동**

3. **환경 변수 추가** (각각 추가):
   ```
   YOUTUBE_API_KEYS=AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY,AIzaSyCjxqyzAGEmC21uyXVk1loyvqeOi3fDaB4,AIzaSyBfD3EPz6DL6J_I05fgT9zt3_iyZ39DkpU
   YOUTUBE_API_KEY=AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY
   NEXT_PUBLIC_BASE_URL=https://realxbest.com
   NEXT_PUBLIC_APP_URL=https://realxbest.com
   NODE_ENV=production
   NEXT_TELEMETRY_DISABLED=1
   ```

4. **저장** 클릭

5. **Manual Deploy** 클릭하여 배포 시작

---

## 배포 후 확인

### 1. 배포 로그 확인
- Render 대시보드 > 서비스 > **Logs** 탭
- 빌드 및 실행 로그 확인
- 오류가 있으면 로그에서 확인

### 2. 사이트 접속 테스트
- https://realxbest.com 접속
- 페이지가 정상적으로 로드되는지 확인

### 3. API 테스트
- https://realxbest.com/api/rankings 접속
- JSON 데이터가 반환되는지 확인
- YouTube API 데이터가 포함되어 있는지 확인

### 4. 프론트엔드 테스트
- 랭킹 페이지에서 데이터가 표시되는지 확인
- 필터링 기능이 작동하는지 확인
- 검색 기능이 작동하는지 확인

---

## 문제 해결

### 배포 실패 시
1. **로그 확인**: Render 대시보드 > Logs에서 오류 메시지 확인
2. **환경 변수 확인**: 모든 필수 환경 변수가 설정되었는지 확인
3. **Dockerfile 확인**: 로컬에서 `docker build .` 테스트

### API 데이터가 안 나올 때
1. **YouTube API 키 확인**: 할당량이 소진되지 않았는지 확인
2. **환경 변수 확인**: `YOUTUBE_API_KEYS`가 올바르게 설정되었는지 확인
3. **API 로그 확인**: Render 로그에서 API 호출 오류 확인

### 환경 변수 설정 오류
- API 키 형식 확인 (쉼표로 구분)
- 따옴표 없이 값만 입력
- 공백 없이 입력

---

## 다음 단계

배포가 완료되면:
1. ✅ 사이트 접속 확인
2. ✅ API 엔드포인트 테스트
3. ✅ 데이터 수신 확인
4. ✅ 성능 모니터링



