# GitHub Actions 수동 실행 가이드

## 🔍 "Run workflow" 버튼 찾는 방법

### 방법 1: Actions 탭에서 찾기

1. **GitHub 저장소 접속**
   - https://github.com/VENCEO86/realxbest

2. **Actions 탭 클릭**
   - 상단 메뉴에서 "Actions" 탭 클릭

3. **왼쪽 사이드바에서 워크플로우 선택**
   - 왼쪽 사이드바에서 "Daily Channel Collection" 클릭

4. **"Run workflow" 버튼 찾기**
   - 오른쪽 상단에 "Run workflow" 드롭다운 버튼이 있습니다
   - 버튼이 보이지 않으면:
     - 브라우저 새로고침 (F5)
     - 다른 브라우저에서 시도
     - GitHub 앱에서 확인

### 방법 2: 직접 URL 접속

1. **워크플로우 페이지 직접 접속**
   - https://github.com/VENCEO86/realxbest/actions/workflows/daily-collect.yml

2. **오른쪽 상단 확인**
   - "Run workflow" 버튼이 보여야 합니다

### 방법 3: 워크플로우 파일에서 실행

1. **워크플로우 파일 열기**
   - https://github.com/VENCEO86/realxbest/blob/main/.github/workflows/daily-collect.yml

2. **오른쪽 상단 확인**
   - "Actions" 탭 또는 "Run workflow" 버튼 확인

## ⚠️ "Run workflow" 버튼이 보이지 않는 경우

### 가능한 원인:

1. **권한 문제**
   - 저장소에 대한 쓰기 권한이 필요합니다
   - 저장소 소유자 또는 협력자인지 확인

2. **워크플로우 파일 문제**
   - `.github/workflows/` 폴더에 파일이 올바르게 있는지 확인
   - 파일 이름이 올바른지 확인 (`daily-collect.yml`)

3. **브라우저 캐시 문제**
   - 브라우저 캐시 삭제
   - 시크릿 모드에서 시도

4. **GitHub Actions 비활성화**
   - 저장소 설정에서 GitHub Actions가 활성화되어 있는지 확인

## ✅ 수동 실행 확인 방법

워크플로우가 실행되면:
1. Actions 탭에서 실행 목록 확인
2. 최신 실행 항목 클릭
3. "collect" job 클릭하여 로그 확인
4. 각 단계별 실행 상태 확인

## 📋 실행 로그 확인 포인트

- ✅ "Checkout code" - 성공
- ✅ "Setup Node.js" - 성공
- ✅ "Install dependencies" - 성공
- ✅ "Verify tsx installation" - 성공
- ✅ "Generate Prisma Client" - 성공
- ✅ "Setup database" - 성공
- ✅ "Run daily collection" - 성공 (약 10-30분 소요)

