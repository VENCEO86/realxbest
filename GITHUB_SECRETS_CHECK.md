# 🔍 GitHub Secrets 설정 확인 및 수정 가이드

## ⚠️ 현재 문제

YouTube API 키 3개를 제공했지만 제대로 인식되지 않는 문제가 발생했습니다.

## ✅ 확인 사항

### 1. GitHub Secrets 설정 확인

**접속 경로:**
1. GitHub 저장소: https://github.com/VENCEO86/realxbest
2. **Settings** 탭 클릭
3. 왼쪽 메뉴: **Secrets and variables** > **Actions**
4. URL: https://github.com/VENCEO86/realxbest/settings/secrets/actions

### 2. 필수 Secrets 확인

다음 2개의 Secret이 **반드시** 있어야 합니다:

#### ✅ DATABASE_URL
- **이름**: `DATABASE_URL` (정확히 일치)
- **값**: Render PostgreSQL 연결 문자열
- **형식**: `postgresql://user:password@host:5432/database`

#### ✅ YOUTUBE_API_KEYS
- **이름**: `YOUTUBE_API_KEYS` (정확히 일치, **Y 포함!**)
- **값**: YouTube API 키 3개 (쉼표로 구분)
- **형식**: `key1,key2,key3` (공백 없음, 줄바꿈 없음)

## 🚨 일반적인 문제

### 문제 1: Secret 이름 오타
- ❌ `OUTUBE_API_KEYS` (Y 빠짐)
- ✅ `YOUTUBE_API_KEYS` (Y 포함)

### 문제 2: 값 형식 오류
- ❌ `key1, key2, key3` (공백 포함)
- ❌ `key1\nkey2\nkey3` (줄바꿈 포함)
- ✅ `key1,key2,key3` (쉼표만, 공백 없음)

### 문제 3: 쉼표 누락
- ❌ `key1key2key3` (쉼표 없음)
- ✅ `key1,key2,key3` (쉼표로 구분)

## 🔧 수정 방법

### 방법 1: Secret 수정 (권장)

1. **GitHub Secrets 페이지 접속**
   - https://github.com/VENCEO86/realxbest/settings/secrets/actions

2. **YOUTUBE_API_KEYS Secret 찾기**
   - Secret 목록에서 `YOUTUBE_API_KEYS` 찾기
   - 이름이 정확한지 확인 (`YOUTUBE_API_KEYS`)

3. **값 확인 및 수정**
   - Secret 옆의 **연필 아이콘** 클릭 (Update)
   - 값 확인:
     - 3개 키가 쉼표로 구분되어 있는지
     - 공백이나 줄바꿈이 없는지
   - 필요시 수정:
     ```
     key1,key2,key3
     ```
   - **Update secret** 클릭

### 방법 2: Secret 삭제 후 재생성

1. **기존 Secret 삭제**
   - `YOUTUBE_API_KEYS` 옆의 **휴지통 아이콘** 클릭
   - 확인 후 삭제

2. **새 Secret 생성**
   - **New repository secret** 버튼 클릭
   - **Name**: `YOUTUBE_API_KEYS` (정확히 입력)
   - **Secret**: 3개 키를 쉼표로 구분하여 입력
     ```
     AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY,AIzaSyCjxqyzAGEmC21uyXVk1loyvqeOi3fDaB4,AIzaSyBfD3EPz6DL6J_I05fgT9zt3_iyZ39DkpU
     ```
   - **Add secret** 클릭

## ✅ 수정 후 확인

### 1. Secret 설정 확인
- https://github.com/VENCEO86/realxbest/settings/secrets/actions
- `DATABASE_URL` ✅
- `YOUTUBE_API_KEYS` ✅ (이름 정확한지 확인)

### 2. GitHub Actions 수동 실행 테스트

1. **Actions 페이지 접속**
   - https://github.com/VENCEO86/realxbest/actions

2. **워크플로우 선택**
   - **Daily Channel Collection** 클릭

3. **수동 실행**
   - 오른쪽 상단 **Run workflow** 버튼 클릭
   - **Run workflow** 다시 클릭

4. **실행 로그 확인**
   - 실행이 시작되면 로그 확인
   - **Verify environment variables** 단계에서:
     - ✅ 성공: "✅ YOUTUBE_API_KEYS 형식이 올바릅니다. 키 개수: 3개"
     - ❌ 실패: 오류 메시지 확인

### 3. 로그에서 확인할 내용

**성공 시:**
```
🔍 Verifying environment variables...
📊 YOUTUBE_API_KEYS 검증:
  ✅ YOUTUBE_API_KEYS 형식이 올바릅니다.
  📝 키 개수: 3개
  📝 키 1: AIzaSyAQd... (39자)
  📝 키 2: AIzaSyCjx... (39자)
  📝 키 3: AIzaSyBfD... (39자)
```

**실패 시:**
```
❌ YOUTUBE_API_KEYS가 설정되지 않았습니다.
또는
❌ YOUTUBE_API_KEYS에 유효한 키가 없습니다.
```

## 📋 체크리스트

- [ ] GitHub Secrets 페이지 접속 완료
- [ ] `YOUTUBE_API_KEYS` Secret 이름 확인 (Y 포함)
- [ ] Secret 값 형식 확인 (key1,key2,key3)
- [ ] 공백이나 줄바꿈 없는지 확인
- [ ] 3개 키가 모두 포함되어 있는지 확인
- [ ] GitHub Actions 수동 실행 테스트 완료
- [ ] 실행 로그에서 키 인식 확인

## 💡 추가 도움말

### Secret 값 형식 예시

**올바른 형식:**
```
AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY,AIzaSyCjxqyzAGEmC21uyXVk1loyvqeOi3fDaB4,AIzaSyBfD3EPz6DL6J_I05fgT9zt3_iyZ39DkpU
```

**잘못된 형식:**
```
AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY, AIzaSyCjxqyzAGEmC21uyXVk1loyvqeOi3fDaB4, AIzaSyBfD3EPz6DL6J_I05fgT9zt3_iyZ39DkpU
(공백 포함)

AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY
AIzaSyCjxqyzAGEmC21uyXVk1loyvqeOi3fDaB4
AIzaSyBfD3EPz6DL6J_I05fgT9zt3_iyZ39DkpU
(줄바꿈 포함)
```

## 🚀 다음 단계

Secret 수정 완료 후:
1. GitHub Actions에서 수동 실행 테스트
2. 실행 로그 확인
3. 성공하면 자동 실행 대기 (매일 오전 3시)

