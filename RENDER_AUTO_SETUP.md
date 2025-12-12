# 🤖 Render 환경 변수 자동 설정 가이드

## 🎯 초등학생도 이해할 수 있는 설명

### 📚 배경 설명

**Render**는 웹사이트를 인터넷에 올려주는 서비스입니다.
- 우리가 만든 웹사이트를 Render에 올리면 전 세계 사람들이 볼 수 있어요!
- 하지만 Render에게 "어떤 데이터베이스를 쓸지", "어떤 API 키를 쓸지" 알려줘야 해요.
- 이 정보를 **환경 변수**라고 부릅니다.

### 🤔 왜 자동화가 필요한가요?

**수동 설정**은:
- Render 웹사이트에 직접 들어가서
- 하나하나 클릭해서
- 값을 입력해야 해요
- 실수할 수도 있고, 시간이 오래 걸려요 😓

**자동화**는:
- 스크립트(작은 프로그램)를 실행하면
- 자동으로 모든 설정이 완료돼요!
- 빠르고 정확해요! 🚀

---

## 🚀 자동 설정 방법

### 1단계: Render API 키 발급

1. **Render 대시보드 접속**: https://dashboard.render.com
2. **오른쪽 위 프로필 아이콘** 클릭
3. **"Account Settings"** 클릭
4. **"API Keys"** 탭 클릭
5. **"New API Key"** 버튼 클릭
6. 이름 입력 (예: "auto-setup")
7. **생성된 API 키 복사** (한 번만 보여줘요! 안전하게 보관하세요)

### 2단계: 스크립트 실행

**방법 A: 모든 값을 한 번에 입력**

```powershell
cd d:\realxbest
.\scripts\setup-render-env.ps1 `
  -RenderApiKey "여기에_API_키_붙여넣기" `
  -DatabaseUrl "postgresql://user:pass@host:port/db" `
  -YouTubeApiKey "AIzaSy..." `
  -BaseUrl "https://realxbest.onrender.com"
```

**방법 B: 대화형으로 입력**

```powershell
cd d:\realxbest
.\scripts\setup-render-env.ps1 -RenderApiKey "여기에_API_키_붙여넣기"
```

그러면 필요한 값들을 하나씩 물어볼 거예요!

### 3단계: 확인

스크립트가 끝나면:
- ✅ "환경 변수 설정 완료!" 메시지가 나와요
- Render 대시보드에서 확인할 수 있어요

---

## 📋 필요한 정보

### 1. Render API 키
- Render 대시보드 → Account Settings → API Keys
- 새로 생성하세요!

### 2. DATABASE_URL
- Render에서 PostgreSQL 데이터베이스 생성
- Connection Info → External Connection String 복사
- 형식: `postgresql://user:password@host:port/database`

### 3. YOUTUBE_API_KEY
- YouTube Data API v3 키
- Google Cloud Console에서 발급

### 4. NEXT_PUBLIC_BASE_URL
- Render 배포 URL
- 예: `https://realxbest.onrender.com`

---

## ⚠️ 주의사항

1. **API 키는 비밀이에요!**
   - 다른 사람에게 보여주면 안 돼요
   - GitHub에 올리면 안 돼요 (이미 .gitignore에 추가했어요!)

2. **PostgreSQL 데이터베이스가 필요해요**
   - Render에서 먼저 PostgreSQL 데이터베이스를 만들어야 해요
   - 없으면 DATABASE_URL을 설정할 수 없어요

3. **스크립트 실행 권한**
   - PowerShell에서 실행 정책 오류가 나면:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

---

## 🔧 문제 해결

### "API 키가 유효하지 않습니다"
- API 키를 다시 확인하세요
- Render 대시보드에서 새로 생성하세요

### "서비스를 찾을 수 없습니다"
- Service ID가 맞는지 확인하세요
- 현재: `srv-d48p38jipnbc73dkh990`

### "데이터베이스 연결 실패"
- DATABASE_URL 형식이 맞는지 확인하세요
- PostgreSQL 데이터베이스가 실행 중인지 확인하세요

---

## 💡 수동 설정이 필요한 경우

다음 경우에는 수동 설정이 필요해요:

1. **Render API 키를 발급할 수 없는 경우**
   - 계정 권한 문제
   - API 기능이 비활성화된 경우

2. **스크립트 실행이 안 되는 경우**
   - PowerShell 버전 문제
   - 네트워크 문제

3. **특별한 설정이 필요한 경우**
   - 복잡한 환경 변수 그룹
   - 특수한 보안 요구사항

---

## 📝 수동 설정 방법 (간단 버전)

1. Render 대시보드 → realxbest 서비스 → Environment
2. **"+ Add"** 버튼 클릭
3. 키와 값 입력:
   - `DATABASE_URL` = PostgreSQL 연결 문자열
   - `YOUTUBE_API_KEY` = YouTube API 키
   - `NEXT_PUBLIC_BASE_URL` = https://realxbest.onrender.com
   - `NODE_ENV` = production
4. **Save** 클릭

---

## 🎉 완료!

환경 변수 설정이 완료되면:
1. Render에서 자동으로 재배포가 시작돼요
2. 몇 분 후 웹사이트가 작동해요!
3. https://realxbest.onrender.com 에서 확인할 수 있어요!

