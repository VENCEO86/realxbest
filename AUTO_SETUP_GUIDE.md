# 🤖 완전 자동화 설정 가이드

## ✅ 자동화 가능 여부

### 자동화 가능한 부분
- ✅ 코드 수정 및 푸시
- ✅ 워크플로우 파일 수정
- ✅ 스크립트 생성

### 수동 설정 필요한 부분
- ⚠️ GitHub Secrets 설정 (GitHub CLI 또는 웹에서)
- ⚠️ GitHub CLI 설치 (자동화를 원하는 경우)

---

## 🚀 완전 자동화 방법

### 방법 1: GitHub CLI 사용 (가장 빠름)

#### 1단계: GitHub CLI 설치
```powershell
# winget 사용 (Windows)
winget install GitHub.cli

# 또는 수동 다운로드
# https://cli.github.com/
```

#### 2단계: GitHub 로그인
```powershell
gh auth login
```

#### 3단계: Secrets 자동 설정
```powershell
# 환경 변수 설정 (선택사항)
$env:DATABASE_URL = "postgresql://..."
$env:YOUTUBE_API_KEYS = "AIzaSy...,AIzaSy...,AIzaSy..."

# 자동 설정 스크립트 실행
.\scripts\setup-github-secrets-gh-cli.ps1
```

**또는 직접 명령어 실행:**
```powershell
gh secret set DATABASE_URL --repo VENCEO86/realxbest --body "your-database-url"
gh secret set YOUTUBE_API_KEYS --repo VENCEO86/realxbest --body "your-api-keys"
```

---

### 방법 2: 수동 설정 (가장 확실)

#### 1단계: GitHub Secrets 페이지 접속
- https://github.com/VENCEO86/realxbest/settings/secrets/actions

#### 2단계: Secret 추가
1. "New repository secret" 클릭
2. Name: `DATABASE_URL`, Value: Render PostgreSQL URL
3. "Add secret" 클릭
4. 다시 "New repository secret" 클릭
5. Name: `YOUTUBE_API_KEYS`, Value: API 키들 (쉼표로 구분)
6. "Add secret" 클릭

**소요 시간**: 약 2분

---

## 🔍 자동화 스크립트 사용 방법

### GitHub CLI가 설치된 경우
```powershell
# 스크립트 실행
.\scripts\setup-github-secrets-gh-cli.ps1
```

### GitHub CLI가 없는 경우
```powershell
# 수동 설정 안내 스크립트 실행
.\scripts\setup-github-secrets.ps1
```

---

## ✅ 설정 완료 확인

### 1. Secrets 확인
- https://github.com/VENCEO86/realxbest/settings/secrets/actions
- `DATABASE_URL` ✅
- `YOUTUBE_API_KEYS` ✅

### 2. Actions에서 수동 실행 테스트
- https://github.com/VENCEO86/realxbest/actions
- "Daily Channel Collection" 클릭
- "Run workflow" 버튼 클릭
- 성공하면 ✅ 완료

---

## 💡 권장 방법

**가장 빠른 방법**: GitHub CLI 사용
- 설치: 2분
- 설정: 1분
- 총 소요: 약 3분

**가장 확실한 방법**: 웹에서 수동 설정
- 소요 시간: 약 2분
- 오류 가능성 낮음

---

## 🎯 결론

**자동화 가능**: GitHub CLI 사용 시
**수동 필요**: GitHub CLI 없이 웹에서 직접 설정

두 방법 모두 약 2-3분 소요되며, 설정 후 완전 자동화됩니다!

