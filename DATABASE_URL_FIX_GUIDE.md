# DATABASE_URL 포트 번호 자동 수정 가이드

## 🔍 문제 상황

GitHub Actions에서 다음과 같은 에러가 발생합니다:
```
❌ Database connection failed: invalid port number in database URL
⚠️ No port number found, using default port 5432
```

## 💡 해결 방법

### 방법 1: 자동 수정 (권장) ✅

**이제 코드가 자동으로 포트 번호를 추가합니다!**

워크플로우가 자동으로:
- 포트 번호가 없으면 `:5432`를 자동으로 추가합니다
- 포트 번호가 있으면 그대로 사용합니다

**아무것도 할 필요 없습니다!** 워크플로우를 다시 실행하면 됩니다.

---

### 방법 2: 수동 수정 (더 확실함) 🔧

만약 자동 수정이 안 되면, Render에서 올바른 값을 복사하세요.

#### 단계별 설명 (초등학생 수준)

**1단계: Render 웹사이트 열기**
- 브라우저를 엽니다
- 주소창에 `https://dashboard.render.com` 입력
- 엔터 키를 누릅니다
- 로그인합니다

**2단계: 데이터베이스 찾기**
- 왼쪽 메뉴에서 "PostgreSQL" 또는 "데이터베이스"를 찾습니다
- 클릭합니다
- 데이터베이스 목록이 보입니다
- 우리가 사용하는 데이터베이스를 클릭합니다

**3단계: 연결 정보 복사하기**
- 데이터베이스 상세 페이지가 열립니다
- "Connection Info" 또는 "연결 정보" 버튼을 찾습니다
- 클릭합니다
- 여러 가지 연결 방법이 보입니다
- **"External Connection String"** 또는 **"외부 연결 문자열"**을 찾습니다
- 그 옆에 있는 **"복사"** 버튼을 클릭합니다
- 이제 복사되었습니다!

**4단계: GitHub에 붙여넣기**
- 새 탭을 엽니다
- 주소창에 `https://github.com/VENCEO86/realxbest/settings/secrets/actions` 입력
- 엔터 키를 누릅니다
- "DATABASE_URL"을 찾습니다
- 연필 아이콘(✏️)을 클릭합니다
- 기존 값을 모두 선택합니다 (Ctrl+A)
- 삭제합니다 (Delete 키)
- 복사한 값을 붙여넣습니다 (Ctrl+V)
- **중요**: 포트 번호가 있는지 확인합니다
  - 예: `postgresql://user:pass@host:5432/database`
  - `:5432` 부분이 있어야 합니다!
- "Update secret" 버튼을 클릭합니다

**5단계: 확인하기**
- GitHub Actions 페이지로 이동합니다
- `https://github.com/VENCEO86/realxbest/actions/workflows/daily-collect.yml`
- "Run workflow" 버튼을 클릭합니다
- 실행이 시작되면 로그를 확인합니다
- "Verify database connection" 단계가 ✅ 성공하면 완료!

---

## 📋 올바른 DATABASE_URL 형식

### ✅ 올바른 형식 (포트 번호 포함)
```
postgresql://username:password@host:5432/database?sslmode=require
```

### ❌ 잘못된 형식 (포트 번호 없음)
```
postgresql://username:password@host/database?sslmode=require
```

---

## 🔍 확인 방법

### 포트 번호가 있는지 확인하는 방법:
1. DATABASE_URL을 복사합니다
2. `:` 기호를 찾습니다
3. `:` 다음에 숫자가 있는지 확인합니다
4. 예: `:5432` ← 이게 포트 번호입니다!

### 예시:
```
✅ 올바름: postgresql://user:pass@dpg-xxxxx-a.render.com:5432/dbname
           포트 번호: 5432 ← 이게 있어야 합니다!

❌ 잘못됨: postgresql://user:pass@dpg-xxxxx-a.render.com/dbname
           포트 번호가 없습니다!
```

---

## 🚀 다음 단계

### 자동 수정 사용 (권장):
1. GitHub Actions에서 워크플로우 다시 실행
2. 자동으로 포트 번호가 추가됩니다
3. 성공 확인

### 수동 수정 사용:
1. Render에서 External Connection String 복사
2. GitHub Secrets에 업데이트
3. 워크플로우 다시 실행
4. 성공 확인

---

## 💡 팁

- **Render의 External Connection String**에는 보통 포트 번호가 포함되어 있습니다
- 포트 번호가 없으면 자동으로 `:5432`를 추가합니다
- PostgreSQL의 기본 포트는 **5432**입니다
- 포트 번호는 1부터 65535까지의 숫자여야 합니다

---

## ❓ 여전히 안 되면?

1. Render에서 External Connection String을 다시 복사하세요
2. GitHub Secrets에 다시 붙여넣으세요
3. 포트 번호(`:5432`)가 포함되어 있는지 확인하세요
4. 워크플로우를 다시 실행하세요


