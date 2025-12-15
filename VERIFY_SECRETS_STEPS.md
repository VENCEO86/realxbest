# GitHub Secrets 검증 단계별 가이드

## 🔍 검증 방법

### 방법 1: GitHub Actions 워크플로우 실행 (권장)

1. **워크플로우 페이지 접속**
   - https://github.com/VENCEO86/realxbest/actions/workflows/daily-collect.yml

2. **"Run workflow" 버튼 클릭**
   - 오른쪽 상단의 "Run workflow" 드롭다운 클릭
   - "Run workflow" 버튼 클릭

3. **실행 로그 확인**
   - 실행이 시작되면 최신 실행 항목 클릭
   - "collect" job 클릭
   - "Verify environment variables" 단계 클릭

4. **검증 결과 확인**
   - ✅ 성공: "✅ 모든 Secrets 값이 올바른 형식입니다!"
   - ❌ 실패: 구체적인 에러 메시지 확인

---

## 📋 검증 항목

### DATABASE_URL 검증
- ✅ 존재 여부 확인
- ✅ `postgresql://` 또는 `postgres://`로 시작
- ✅ `@` 기호 포함 (사용자 정보)
- ✅ `/` 기호 포함 (데이터베이스 이름)
- ✅ 길이 확인

### YOUTUBE_API_KEYS 검증
- ✅ 존재 여부 확인
- ✅ 비어있지 않음
- ✅ 쉼표로 구분
- ✅ 각 키 30-50자
- ✅ 알파벳, 숫자, 하이픈, 언더스코어만 포함
- ✅ 빈 값 없음

---

## 🎯 예상되는 검증 결과

### ✅ 성공 시
```
🔍 GitHub Secrets 값 검증 시작...

📊 DATABASE_URL 검증:
  ✅ DATABASE_URL 형식이 올바릅니다.
  📝 형식: postgresql://user:****@host:port/database...
  📏 길이: 123자

📊 YOUTUBE_API_KEYS 검증:
  ✅ YOUTUBE_API_KEYS 형식이 올바릅니다.
  📝 키 개수: 3개
  📝 키 1: AIzaSyAQdv...nAY (39자)
  📝 키 2: AIzaSyCjxq...DaB4 (39자)
  📝 키 3: AIzaSyBfD3...DkpU (39자)

✅ 모든 Secrets 값이 올바른 형식입니다!
🚀 GitHub Actions 워크플로우 실행 준비 완료!
```

### ❌ 실패 시
```
❌ ERROR: DATABASE_URL 형식이 올바르지 않습니다.
   'postgresql://' 또는 'postgres://'로 시작해야 합니다.
```

또는

```
❌ ERROR: YOUTUBE_API_KEYS에 유효한 키가 없습니다.
```

---

## 🔧 문제 해결

### DATABASE_URL 오류
- **문제**: 형식이 올바르지 않음
- **해결**: Render에서 External Connection String 다시 복사
- **확인**: `postgresql://` 또는 `postgres://`로 시작하는지 확인

### YOUTUBE_API_KEYS 오류
- **문제**: 키 형식이 올바르지 않음
- **해결**: Google Cloud Console에서 API 키 다시 확인
- **확인**: 쉼표로 구분되어 있고, 각 키가 30-50자인지 확인

---

## 🚀 검증 후 다음 단계

검증이 성공하면:
1. ✅ 워크플로우가 계속 실행됨
2. ✅ 데이터베이스 연결 검증
3. ✅ 데이터 수집 시작

검증이 실패하면:
1. ❌ 워크플로우 즉시 중단
2. ❌ 에러 메시지 확인
3. ❌ Secrets 값 수정 후 다시 실행

