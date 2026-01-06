# 🔍 GitHub Actions 실행 기록 확인 가이드

## ✅ 현재 설정 상태

### GitHub Secrets
- ✅ `DATABASE_URL` - 설정됨 (3주 전)
- ✅ `YOUTUBE_API_KEYS` - 설정됨 (3주 전)

### GitHub Actions 워크플로우
- ✅ `.github/workflows/daily-collect.yml` - 생성 완료
- ✅ 실행 시간: 매일 UTC 18:00 (한국시간 오전 3시)
- ✅ 수동 실행 가능

---

## 📋 확인 방법

### 방법 1: GitHub 웹사이트에서 확인 (가장 쉬움)

1. **GitHub 저장소 접속**
   - https://github.com/VENCEO86/realxbest

2. **Actions 탭 클릭**
   - 상단 메뉴에서 "Actions" 탭 클릭

3. **워크플로우 선택**
   - 왼쪽 사이드바에서 "Daily Channel Collection" 클릭
   - 또는 최근 실행 기록에서 확인

4. **실행 기록 확인**
   - 각 실행 기록을 클릭하여 상세 로그 확인
   - ✅ 초록색 체크 = 성공
   - ❌ 빨간색 X = 실패
   - 🟡 노란색 원 = 진행 중

5. **로그 확인**
   - 실행 기록 클릭 → "Run daily collection" 단계 클릭
   - 로그에서 다음 확인:
     - "✅ 데이터베이스 연결 성공"
     - "🔑 사용 가능한 API 키: 3개"
     - "✅ Database schema is up to date!"
     - 수집된 채널 수

---

### 방법 2: GitHub CLI 사용 (터미널에서)

#### 설치 (처음 한 번만)
```powershell
winget install --id GitHub.cli
```

#### 로그인 (처음 한 번만)
```powershell
gh auth login
```

#### 실행 기록 확인
```powershell
# 워크플로우 목록 확인
gh workflow list

# 특정 워크플로우 실행 기록 확인
gh run list --workflow=daily-collect.yml --limit 10

# 최근 실행 상세 로그 확인
gh run view --log
```

---

### 방법 3: 웹 브라우저에서 직접 확인

**URL**: https://github.com/VENCEO86/realxbest/actions/workflows/daily-collect.yml

이 URL로 바로 접속하면 실행 기록을 볼 수 있습니다.

---

## 🔍 확인해야 할 사항

### 1. 워크플로우 실행 여부
- [ ] 워크플로우가 생성되었는지 확인
- [ ] 최근 실행 기록이 있는지 확인
- [ ] 실행 시간이 올바른지 확인 (UTC 18:00 = 한국시간 오전 3시)

### 2. 실행 성공 여부
- [ ] 최근 실행이 성공했는지 확인 (초록색 체크)
- [ ] 실패했다면 오류 메시지 확인

### 3. 로그 확인
- [ ] "데이터베이스 연결 성공" 메시지 확인
- [ ] "사용 가능한 API 키: 3개" 메시지 확인
- [ ] 수집된 채널 수 확인
- [ ] 오류 메시지가 있는지 확인

---

## ⚠️ 문제 해결

### 문제 1: 워크플로우가 실행되지 않음

**원인**:
- Secrets가 설정되지 않았을 수 있음
- 워크플로우 파일에 오류가 있을 수 있음

**해결**:
1. GitHub Secrets 재확인
2. 워크플로우 파일 문법 확인
3. 수동 실행 테스트

### 문제 2: 실행은 되지만 실패함

**원인**:
- DATABASE_URL이 잘못되었을 수 있음
- YOUTUBE_API_KEYS가 잘못되었을 수 있음
- API 할당량 소진

**해결**:
1. 실행 로그 확인
2. 오류 메시지 확인
3. Secrets 값 재확인

### 문제 3: 실행은 성공하지만 데이터가 추가되지 않음

**원인**:
- API 할당량 소진
- 검색 결과가 없음
- 필터링 기준이 너무 엄격함

**해결**:
1. 로그에서 "수집된 채널 수" 확인
2. API 할당량 확인
3. 필터링 기준 조정

---

## 📊 예상 실행 시간

- **자동 실행**: 매일 UTC 18:00 (한국시간 오전 3시)
- **수동 실행**: 언제든지 가능

---

## ✅ 체크리스트

- [x] GitHub Secrets 설정 확인 (DATABASE_URL, YOUTUBE_API_KEYS)
- [x] GitHub Actions 워크플로우 파일 생성
- [ ] 워크플로우 실행 기록 확인
- [ ] 최근 실행 성공 여부 확인
- [ ] 실행 로그 확인
- [ ] 데이터 추가 확인

---

## 🎯 빠른 확인 방법

**가장 빠른 방법**: 브라우저에서 다음 URL 접속

https://github.com/VENCEO86/realxbest/actions/workflows/daily-collect.yml

이 URL에서 바로 실행 기록을 확인할 수 있습니다!

