# 🔧 Render 데이터베이스 설정 완벽 가이드 (초등학생도 이해 가능!)

## 📋 문제 분석

**왜 로컬과 서버가 다른가요?**
- 로컬 컴퓨터: 데이터베이스가 있어서 3,656개 채널이 보임 ✅
- Render 서버: 데이터베이스가 비어있어서 데이터가 안 보임 ❌

**해결 방법**: Render 데이터베이스에 테이블을 만들어주고 데이터를 넣어야 합니다!

---

## ✅ Render 데이터베이스 설정 단계별 가이드

### 🎯 목표
Render 서버에서도 로컬처럼 3,656개 채널이 보이도록 설정하기!

---

## 1단계: Render 대시보드 접속하기

### 1-1. 브라우저 열기
1. 크롬(Chrome) 또는 엣지(Edge) 브라우저 열기
2. 주소창에 입력: `https://dashboard.render.com`
3. 엔터(Enter) 키 누르기

### 1-2. 로그인하기
- 이미 로그인되어 있으면 다음 단계로!
- 로그인이 안 되어 있으면:
  1. 오른쪽 위에 있는 **"Log In"** 버튼 클릭
  2. 이메일과 비밀번호 입력
  3. **"Log In"** 버튼 클릭

---

## 2단계: 데이터베이스 연결 주소 복사하기

### 2-1. 데이터베이스 찾기
1. 왼쪽 사이드바(메뉴)에서 아래로 스크롤
2. **"realxbest-db"** 라는 글자를 찾기
   - 글자 옆에 작은 데이터베이스 아이콘(📊)이 있음
3. **"realxbest-db"** 클릭

### 2-2. Info 탭 확인하기
- 화면 상단에 여러 탭이 보임:
  - **"Info"** ← 이걸 클릭! (보라색으로 선택되어 있을 수도 있음)
  - "Logs"
  - "Metrics"
  - "Apps"
  - "Recovery"

### 2-3. Connection Info 찾기
1. 화면을 아래로 스크롤
2. **"Connection Info"** 라는 제목 찾기
   - 제목 아래에 여러 박스들이 있음:
     - "Host"
     - "Port"
     - "Database"
     - "User"
     - "Password"
     - **"External Connection String"** ← 이게 중요!

### 2-4. External Connection String 복사하기
1. **"External Connection String"** 박스 찾기
   - 박스 안에 긴 글자가 있음
   - 예시: `postgresql://realxbest_user:abc123@dpg-d4vpt4umcj7s73ds1uj0-a.oregon-postgres.render.com/realxbest`
2. 박스 오른쪽에 있는 **"Copy"** 버튼 클릭
   - 또는 박스 안의 글자를 마우스로 드래그해서 전체 선택 (Ctrl+A)
   - 복사 (Ctrl+C)

✅ **복사 완료!** 이제 이 주소를 어딘가에 메모해두세요!

---

## 3단계: Web Service에 연결 주소 넣기

### 3-1. Web Service 찾기
1. 왼쪽 사이드바(메뉴)에서 위로 스크롤
2. **"← Dashboard"** 라는 글자 찾기
3. 그 아래에 **"realxbest"** 라는 글자 찾기
   - 글자 옆에 작은 지구 아이콘(🌐)이 있음
4. **"realxbest"** 클릭

### 3-2. Environment 탭 클릭하기
- 화면 상단에 여러 탭이 보임:
  - "Events" (현재 선택되어 있을 수 있음)
  - **"Settings"** ← 이걸 클릭!
  - "Logs"
  - "Metrics"
  - "Environment" ← 이걸 클릭!
  - "Shell"
  - "Scaling"
  - "Previews"
  - "Disk"
  - "Jobs"

### 3-3. Environment 변수 목록 보기
- 화면에 여러 환경 변수들이 보임:
  - `NODE_ENV`
  - `NEXT_TELEMETRY_DISABLED`
  - `YOUTUBE_API_KEY` (있을 수도, 없을 수도 있음)
  - `DATABASE_URL` (있을 수도, 없을 수도 있음)

### 3-4. DATABASE_URL 추가하기

#### 경우 A: DATABASE_URL이 없는 경우
1. 화면 오른쪽 위에 있는 **"+ Add"** 버튼 클릭
   - 파란색 버튼일 수도 있음
2. 두 개의 입력창이 나타남:
   - **"Key"** 입력창: `DATABASE_URL` 입력
   - **"Value"** 입력창: 2단계에서 복사한 주소 붙여넣기 (Ctrl+V)
3. **"Save Changes"** 버튼 클릭
   - 또는 **"Add"** 버튼 클릭

#### 경우 B: DATABASE_URL이 이미 있는 경우
1. `DATABASE_URL` 행을 찾기
2. 오른쪽에 있는 **연필 아이콘(✏️)** 또는 **"Edit"** 버튼 클릭
3. **"Value"** 입력창에 2단계에서 복사한 주소 붙여넣기 (Ctrl+V)
4. **"Save Changes"** 버튼 클릭

✅ **설정 완료!** 이제 데이터베이스 연결 주소가 저장되었습니다!

---

## 4단계: 데이터베이스 테이블 만들기 (Prisma 마이그레이션)

### 4-1. Shell 탭 열기
1. 왼쪽 사이드바에서 **"realxbest"** 클릭 (이미 선택되어 있을 수 있음)
2. 화면 상단 탭에서 **"Shell"** 탭 클릭
   - 탭 목록: "Events", "Settings", "Logs", "Metrics", "Environment", **"Shell"**, "Scaling", ...

### 4-2. Shell 창 확인하기
- 검은색 또는 어두운 배경의 창이 나타남
- 맨 아래에 커서가 깜빡임
- 예시 화면:
  ```
  $ 
  ```
  (이런 식으로 보임)

### 4-3. 첫 번째 명령어 입력하기
1. Shell 창에 다음을 입력 (복사해서 붙여넣기 가능):
   ```
   npx prisma generate
   ```
2. 엔터(Enter) 키 누르기
3. 기다리기 (10-30초 정도)
4. 성공 메시지 확인:
   ```
   ✔ Generated Prisma Client
   ```

### 4-4. 두 번째 명령어 입력하기
1. Shell 창에 다음을 입력:
   ```
   npx prisma db push
   ```
2. 엔터(Enter) 키 누르기
3. 기다리기 (10-30초 정도)
4. 성공 메시지 확인:
   ```
   ✅ Database schema is up to date!
   ```
   또는
   ```
   ✔ Your database is now in sync with your Prisma schema.
   ```

✅ **테이블 생성 완료!** 이제 데이터베이스에 테이블이 만들어졌습니다!

---

## 5단계: 서비스 재시작하기

### 5-1. Manual Deploy 버튼 찾기
1. 왼쪽 사이드바에서 **"realxbest"** 클릭
2. 화면 오른쪽 위를 보기
3. **"Manual Deploy"** 버튼 찾기
   - 파란색 버튼일 수도 있음
   - 옆에 작은 화살표(▼)가 있을 수 있음

### 5-2. Manual Deploy 실행하기
1. **"Manual Deploy"** 버튼 클릭
2. 작은 메뉴가 나타나면:
   - **"Deploy latest commit"** 클릭
   - 또는 그냥 버튼을 클릭하면 자동으로 시작됨

### 5-3. 배포 진행 확인하기
- 화면에 배포 진행 상황이 보임:
  - "Building..."
  - "Deploying..."
  - "Live" ✅ (완료!)

⏰ **기다리기**: 2-5분 정도 걸릴 수 있습니다!

---

## 6단계: 확인하기

### 6-1. 웹사이트 접속하기
1. 브라우저 새 탭 열기
2. 주소창에 입력: `https://realxbest.com`
3. 엔터(Enter) 키 누르기

### 6-2. 데이터 확인하기
- 화면에 채널 목록이 보이는지 확인
- 페이지 하단에 "1 - 200 / 3,656" 같은 숫자가 보이는지 확인
- 보이면 ✅ 성공!

---

## 🔍 문제 해결 (에러가 났을 때)

### 문제 1: "Can't reach database server"

**증상**: Shell에서 `npx prisma db push` 실행 시 에러 발생

**해결 방법**:
1. **realxbest-db** → **Info** 탭으로 이동
2. **"Status"** 확인
   - "Available" (초록색 체크) ✅ → 정상
   - "Unavailable" (빨간색 X) ❌ → 재시작 필요
3. Status가 "Unavailable"이면:
   - 오른쪽 위에 **"Restart"** 버튼 클릭
   - 기다리기 (1-2분)
   - 다시 "Available"이 되면 4단계부터 다시 시도

---

### 문제 2: "Authentication failed"

**증상**: 데이터베이스 연결 실패

**해결 방법**:
1. **realxbest-db** → **Info** 탭으로 이동
2. **"Connection Info"** 섹션 찾기
3. **"External Connection String"** 다시 복사
4. **realxbest** → **Environment** 탭으로 이동
5. `DATABASE_URL` 수정 (3-4단계 참고)

---

### 문제 3: "Database schema is not up to date"

**증상**: Shell에서 `npx prisma db push` 실행 시 경고 메시지

**해결 방법**:
1. Shell에서 다음 명령어 실행:
   ```
   npx prisma db push --force-reset
   ```
   ⚠️ **주의**: 이 명령어는 기존 데이터를 삭제합니다!
2. 엔터(Enter) 키 누르기
3. "y" 입력하고 엔터 (확인)

---

### 문제 4: 데이터가 여전히 안 보임

**증상**: 웹사이트에 채널이 안 보임

**원인**: 데이터베이스 테이블은 만들어졌지만 데이터가 없음

**해결 방법**:
1. Render Shell에서 데이터 확인:
   ```
   npx prisma studio
   ```
2. 브라우저에 자동으로 열림
3. `youtube_channels` 테이블 클릭
4. 데이터가 없으면:
   - 로컬에서 데이터 수집 스크립트 실행 필요
   - 또는 GitHub Actions가 자동으로 데이터 수집할 때까지 대기

---

## 📋 체크리스트 (한 번에 확인하기)

설정이 제대로 되었는지 확인:

- [ ] **1단계**: Render 대시보드 접속 완료
- [ ] **2단계**: External Connection String 복사 완료
- [ ] **3단계**: DATABASE_URL 환경 변수 추가 완료
- [ ] **4단계**: `npx prisma generate` 실행 성공
- [ ] **4단계**: `npx prisma db push` 실행 성공
- [ ] **5단계**: Manual Deploy 완료
- [ ] **6단계**: 웹사이트에서 데이터 확인 완료

---

## 🎯 빠른 설정 (한 번에 복사해서 붙여넣기)

Render Shell에서 다음 명령어들을 순서대로 실행:

```bash
# 1. Prisma 클라이언트 생성
npx prisma generate

# 2. 데이터베이스 테이블 만들기
npx prisma db push

# 3. 연결 테스트 (선택사항)
npx prisma db execute --stdin <<< "SELECT 1"
```

**사용 방법**:
1. Shell 탭 열기
2. 첫 번째 명령어 복사해서 붙여넣기 → 엔터
3. 두 번째 명령어 복사해서 붙여넣기 → 엔터
4. 세 번째 명령어 복사해서 붙여넣기 → 엔터 (선택사항)

모든 명령어가 성공하면 ✅ 설정 완료!

---

## 💡 팁

### 팁 1: 환경 변수 확인하기
- **realxbest** → **Environment** 탭에서 모든 변수 확인 가능
- 필수 변수:
  - `DATABASE_URL` ✅
  - `YOUTUBE_API_KEY` ✅
  - `NEXT_PUBLIC_BASE_URL` ✅
  - `NODE_ENV` ✅

### 팁 2: 로그 확인하기
- **realxbest** → **Logs** 탭에서 오류 메시지 확인 가능
- 빨간색 글자 = 에러
- 노란색 글자 = 경고
- 초록색 글자 = 성공

### 팁 3: 데이터베이스 상태 확인하기
- **realxbest-db** → **Info** 탭에서 Status 확인
- "Available" = 정상 작동 중 ✅
- "Unavailable" = 문제 있음 ❌

---

## ✅ 완료!

이제 Render 서버에서도 로컬처럼 데이터가 보일 것입니다!

문제가 있으면 위의 "문제 해결" 섹션을 참고하세요.
