# ✅ GitHub Secrets 설정 검증 가이드

## 🔍 설정 확인 방법

### 방법 1: GitHub 웹에서 직접 확인 (가장 확실)

#### 1단계: Secrets 설정 페이지 접속
1. GitHub 저장소 접속: https://github.com/VENCEO86/realxbest
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **Secrets and variables** > **Actions** 클릭
4. URL: https://github.com/VENCEO86/realxbest/settings/secrets/actions

#### 2단계: 필수 Secrets 확인
다음 2개의 Secret이 **반드시** 있어야 합니다:

✅ **DATABASE_URL**
- 이름: `DATABASE_URL`
- 값: Render PostgreSQL 연결 문자열 (보안상 값은 표시되지 않음)

✅ **YOUTUBE_API_KEYS**
- 이름: `YOUTUBE_API_KEYS`
- 값: YouTube API 키들 (쉼표로 구분, 보안상 값은 표시되지 않음)

#### 3단계: 확인 완료
- ✅ 두 개의 Secret이 모두 있으면 → **설정 완료**
- ❌ 하나라도 없으면 → **추가 필요**

---

### 방법 2: GitHub Actions 실행 기록 확인

#### 1단계: Actions 탭 접속
1. GitHub 저장소: https://github.com/VENCEO86/realxbest
2. **Actions** 탭 클릭
3. URL: https://github.com/VENCEO86/realxbest/actions

#### 2단계: 워크플로우 확인
- **Daily Channel Collection** 워크플로우가 보여야 합니다
- 최근 실행 기록이 있으면 설정이 되어 있는 것입니다

#### 3단계: 수동 실행으로 테스트
1. **Daily Channel Collection** 워크플로우 클릭
2. 오른쪽 상단 **Run workflow** 버튼 클릭
3. **Run workflow** 다시 클릭하여 실행
4. 실행 로그 확인:
   - ✅ 성공: Secrets가 올바르게 설정됨
   - ❌ 실패: 오류 메시지 확인 필요

---

### 방법 3: 실행 로그에서 확인

#### Secrets 미설정 시 오류 메시지
```
Error: Input required and not supplied: DATABASE_URL
또는
Error: Input required and not supplied: YOUTUBE_API_KEYS
```

#### Secrets 설정 완료 시
- 워크플로우가 정상적으로 실행됨
- 로그에 "🚀 데일리 자동 채널 수집 시작..." 메시지 표시
- 데이터베이스 연결 및 수집 진행 로그 표시

---

## 🧪 즉시 테스트 방법

### 수동 실행 (가장 빠른 검증)

1. **GitHub Actions 페이지 접속**
   - https://github.com/VENCEO86/realxbest/actions

2. **Daily Channel Collection 클릭**

3. **Run workflow 버튼 클릭**
   - Branch: `main` 선택
   - **Run workflow** 클릭

4. **실행 상태 확인**
   - 실행 중: 노란색 원 (⏳)
   - 성공: 초록색 체크 (✅)
   - 실패: 빨간색 X (❌)

5. **로그 확인**
   - 실행 항목 클릭
   - **collect** 작업 클릭
   - 로그 확인:
     - ✅ "🚀 데일리 자동 채널 수집 시작..." → 성공
     - ❌ "Error: Input required..." → Secrets 미설정

---

## 📋 검증 체크리스트

### Secrets 설정 확인
- [ ] GitHub Settings > Secrets > Actions 접속 가능
- [ ] `DATABASE_URL` Secret 존재
- [ ] `YOUTUBE_API_KEYS` Secret 존재
- [ ] 두 Secret 모두 값이 설정되어 있음 (보안상 값은 표시 안 됨)

### 워크플로우 실행 확인
- [ ] Actions 탭에서 "Daily Channel Collection" 워크플로우 보임
- [ ] 수동 실행(Run workflow) 가능
- [ ] 실행 시 오류 없이 진행됨
- [ ] 로그에 정상 실행 메시지 표시

### 자동 실행 확인
- [ ] 다음 실행 예정 시간 확인 가능
- [ ] 또는 이미 실행 기록이 있음

---

## 🎯 빠른 확인 방법

**가장 빠른 방법:**
1. https://github.com/VENCEO86/realxbest/settings/secrets/actions 접속
2. 두 개의 Secret이 있는지 확인

**또는:**
1. https://github.com/VENCEO86/realxbest/actions 접속
2. "Run workflow" 버튼으로 수동 실행
3. 성공/실패 확인

---

## 💡 문제 해결

### Secrets가 없으면?
1. Settings > Secrets > Actions 접속
2. **New repository secret** 클릭
3. 위의 2개 Secret 추가

### 워크플로우가 실행되지 않으면?
1. Actions 탭에서 오류 메시지 확인
2. Secrets 설정 확인
3. 수동 실행으로 테스트

### 실행은 되지만 실패하면?
1. 실행 로그 확인
2. 오류 메시지 확인
3. DATABASE_URL 형식 확인 (postgresql://...)
4. YOUTUBE_API_KEYS 형식 확인 (쉼표로 구분)

---

## ✅ 최종 확인

**설정이 올바르게 되었는지 확인:**
1. ✅ Secrets 페이지에서 2개 Secret 존재 확인
2. ✅ Actions에서 수동 실행 성공 확인
3. ✅ 다음 자동 실행 예정 시간 확인

**모두 확인되면 → 완전 자동화 완료!** 🎉

