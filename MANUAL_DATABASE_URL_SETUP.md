# DATABASE_URL 수동 설정 방법 (초등학생 수준)

## 🎯 목표
Render에서 복사한 데이터베이스 주소를 GitHub에 입력하는 것입니다.

---

## 📋 단계별 설명

### 1단계: GitHub 웹사이트 열기

1. **브라우저를 엽니다**
2. **주소창을 클릭합니다** (맨 위에 있는 긴 박스)
3. **다음을 입력합니다:**
   ```
   https://github.com/VENCEO86/realxbest/settings/secrets/actions
   ```
4. **엔터 키를 누릅니다**
5. **로그인합니다** (필요한 경우)

---

### 2단계: DATABASE_URL 찾기

1. **화면에 여러 개의 "Secret"이 보입니다**
   - "DATABASE_URL", "YOUTUBE_API_KEYS" 등이 보입니다

2. **"DATABASE_URL"을 찾습니다**
   - 목록에서 "DATABASE_URL" 글자를 찾습니다

3. **"DATABASE_URL" 오른쪽에 있는 연필 아이콘(✏️)을 클릭합니다**
   - 또는 "Update" 버튼을 클릭합니다

---

### 3단계: 값 입력하기

1. **"Value" 칸을 클릭합니다**
   - 큰 텍스트 입력 칸이 보입니다

2. **기존 값이 있으면 삭제합니다:**
   - 전체 선택: `Ctrl + A` (컨트롤 키와 A 키를 동시에 누름)
   - 삭제: `Delete` 키를 누름

3. **다음 값을 복사합니다:**
   ```
   postgresql://realxbest_user:La71vp2YVSgoUN1QLsdqRtV40wngw0CC@dpg-d4vpt4umcj7s73ds1uj0-a.oregon-postgres.render.com/realxbest
   ```
   - 위의 긴 글자를 마우스로 드래그해서 선택합니다
   - 복사: `Ctrl + C` (컨트롤 키와 C 키를 동시에 누름)

4. **"Value" 칸에 붙여넣기:**
   - "Value" 칸을 클릭합니다
   - 붙여넣기: `Ctrl + V` (컨트롤 키와 V 키를 동시에 누름)
   - 긴 글자가 붙여넣어집니다

5. **확인:**
   - 붙여넣은 값이 올바른지 확인합니다
   - `postgresql://`로 시작하는지 확인합니다
   - `@` 기호가 있는지 확인합니다
   - `/realxbest`로 끝나는지 확인합니다

---

### 4단계: 저장하기

1. **맨 아래에 있는 "Update secret" 버튼을 찾습니다**
   - 초록색 또는 검은색 버튼입니다

2. **"Update secret" 버튼을 클릭합니다**
   - 클릭하면 저장됩니다

3. **완료 메시지가 나타납니다**
   - "Secret updated" 또는 "업데이트 완료" 같은 메시지가 보입니다

---

### 5단계: 확인하기

1. **GitHub Actions 페이지로 이동합니다**
   - 주소창에 다음을 입력합니다:
   ```
   https://github.com/VENCEO86/realxbest/actions/workflows/daily-collect.yml
   ```
   - 엔터 키를 누릅니다

2. **"Run workflow" 버튼을 클릭합니다**
   - 오른쪽 위에 있는 버튼입니다

3. **"Run workflow" 버튼을 다시 클릭합니다**
   - 드롭다운 메뉴에서 "Run workflow"를 클릭합니다

4. **실행이 시작됩니다**
   - 잠시 기다립니다 (1-2분)

5. **성공 확인:**
   - "Verify database connection" 단계에 ✅ 표시가 나타나면 성공입니다!

---

## ✅ 완료 확인

다음이 모두 완료되었는지 확인하세요:

- [ ] GitHub Secrets 페이지에 접속했습니다
- [ ] "DATABASE_URL"을 찾았습니다
- [ ] 연필 아이콘을 클릭했습니다
- [ ] 기존 값을 삭제했습니다
- [ ] 새로운 값을 붙여넣었습니다
- [ ] "Update secret" 버튼을 클릭했습니다
- [ ] GitHub Actions에서 워크플로우를 실행했습니다
- [ ] "Verify database connection" 단계가 성공했습니다

---

## 🔍 문제 해결

### 문제 1: "Update secret" 버튼이 안 보여요

**해결 방법:**
- 페이지를 아래로 스크롤해봅니다
- 또는 "Save" 또는 "저장" 버튼을 찾아봅니다

---

### 문제 2: 붙여넣기가 안 돼요

**해결 방법:**
- "Value" 칸을 클릭합니다
- 마우스 오른쪽 버튼을 클릭합니다
- "붙여넣기" 또는 "Paste"를 선택합니다
- 또는 `Ctrl + V`를 누릅니다

---

### 문제 3: 값이 너무 길어서 확인이 어려워요

**해결 방법:**
- 값이 올바르게 붙여넣어졌는지 확인하려면:
  - `postgresql://`로 시작하는지 확인
  - `@` 기호가 있는지 확인
  - `/realxbest`로 끝나는지 확인
- 정확한 값:
  ```
  postgresql://realxbest_user:La71vp2YVSgoUN1QLsdqRtV40wngw0CC@dpg-d4vpt4umcj7s73ds1uj0-a.oregon-postgres.render.com/realxbest
  ```

---

## 💡 팁

- **복사할 때**: 전체 값을 정확히 복사해야 합니다
- **붙여넣을 때**: 공백이나 줄바꿈이 없어야 합니다
- **확인할 때**: `postgresql://`로 시작하고 `/realxbest`로 끝나는지 확인합니다

---

## 🚀 다음 단계

DATABASE_URL을 설정한 후:

1. **GitHub Actions에서 워크플로우 실행**
2. **"Verify database connection" 단계 성공 확인**
3. **"Setup database" 단계 성공 확인**
4. **"Run daily collection" 단계 성공 확인**

이제 자동으로 데이터가 수집됩니다!


