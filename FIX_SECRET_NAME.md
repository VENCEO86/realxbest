# ⚠️ GitHub Secret 이름 오타 수정 가이드

## 🔍 발견된 문제

스크린샷에서 확인된 Secret 이름:
- ✅ `DATABASE_URL` - 정확함
- ❌ `OUTUBE_API_KEYS` - **오타 발견!** (Y가 빠짐)

워크플로우에서 사용하는 이름:
- `YOUTUBE_API_KEYS` (Y 포함)

## 🚨 문제점

현재 설정된 Secret 이름이 `OUTUBE_API_KEYS`인데, 워크플로우는 `YOUTUBE_API_KEYS`를 찾고 있어서 **작동하지 않을 수 있습니다**.

---

## ✅ 해결 방법

### 방법 1: Secret 이름 수정 (권장)

1. **GitHub Secrets 페이지 접속**
   - https://github.com/VENCEO86/realxbest/settings/secrets/actions

2. **`OUTUBE_API_KEYS` Secret 삭제**
   - `OUTUBE_API_KEYS` 옆의 삭제 아이콘(휴지통) 클릭
   - 확인 후 삭제

3. **새 Secret 생성**
   - "New repository secret" 버튼 클릭
   - Name: `YOUTUBE_API_KEYS` (Y 포함!)
   - Value: 기존 값 그대로 입력
     ```
     AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY,AIzaSyCjxqyzAGEmC21uyXVk1loyvqeOi3fDaB4,AIzaSyBfD3EPz6DL6J_I05fgT9zt3_iyZ39DkpU
     ```
   - "Add secret" 클릭

### 방법 2: 기존 Secret 값 확인 후 재생성

1. **기존 Secret 값 확인**
   - `OUTUBE_API_KEYS` 옆의 편집 아이콘(연필) 클릭
   - 값 확인 (보안상 표시되지 않을 수 있음)

2. **값 복사** (가능한 경우)

3. **삭제 후 재생성**
   - 삭제 → 새로 생성 (이름: `YOUTUBE_API_KEYS`)

---

## ✅ 수정 후 확인

### 1. Secret 이름 확인
- https://github.com/VENCEO86/realxbest/settings/secrets/actions
- `DATABASE_URL` ✅
- `YOUTUBE_API_KEYS` ✅ (Y 포함 확인)

### 2. 수동 실행 테스트
- https://github.com/VENCEO86/realxbest/actions
- "Daily Channel Collection" 클릭
- "Run workflow" 버튼으로 수동 실행
- 성공하면 ✅ 수정 완료

---

## 📋 정확한 Secret 이름 체크리스트

올바른 이름:
- ✅ `DATABASE_URL` (대문자, 언더스코어)
- ✅ `YOUTUBE_API_KEYS` (Y 포함, 대문자, 언더스코어)

잘못된 이름:
- ❌ `OUTUBE_API_KEYS` (Y 빠짐)
- ❌ `youtube_api_keys` (소문자)
- ❌ `YOUTUBE-API-KEYS` (하이픈 사용)

---

## 💡 참고사항

- Secret 이름은 **대소문자 구분**됩니다
- 정확한 이름: `YOUTUBE_API_KEYS` (Y 포함)
- 워크플로우 파일에서 사용하는 이름과 **정확히 일치**해야 합니다

---

## 🎯 빠른 수정 방법

1. GitHub Secrets 페이지 접속
2. `OUTUBE_API_KEYS` 삭제
3. 새 Secret 생성: 이름 `YOUTUBE_API_KEYS`, 값은 기존과 동일
4. Actions에서 수동 실행 테스트

수정 후에는 자동화가 정상 작동합니다! 🚀

