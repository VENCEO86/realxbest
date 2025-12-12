# 🔧 모든 문제 해결 가이드

## 🎯 문제 요약

1. **채널 아이콘 이미지가 표시되지 않음** ✅ 해결됨
2. **프론트-백엔드 연동 오류** ✅ 해결됨
3. **다중 API 키가 인식되지 않음** ⚠️ 환경 변수 설정 필요
4. **데이터 오류** ⚠️ API 키 문제로 인한 Mock 데이터 사용

## 🚀 최선의 해결 방법 (한 번에 모든 문제 해결)

### 방법 1: 자동 설정 스크립트 실행 (추천)

```powershell
# 1. 환경 변수 자동 설정
npm run setup-env

# 2. 개발 서버 재시작
# (현재 실행 중인 서버가 있다면 Ctrl+C로 중지 후)
npm run dev
```

### 방법 2: 수동 설정

#### Step 1: .env.local 파일 생성

프로젝트 루트 디렉토리에 `.env.local` 파일을 생성하고 다음 내용을 추가:

```env
# YouTube API Keys (다중 키 지원 - 쉼표로 구분)
YOUTUBE_API_KEYS=AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY,AIzaSyCjxqyzAGEmC21uyXVk1loyvqeOi3fDaB4,AIzaSyBfD3EPz6DL6J_I05fgT9zt3_iyZ39DkpU

# 기본 API 키 (하위 호환성)
YOUTUBE_API_KEY=AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY

# Next.js 설정
NEXT_PUBLIC_BASE_URL=http://localhost:3001

# Database (선택사항 - 없으면 Mock 데이터 사용)
# DATABASE_URL=postgresql://user:password@localhost:5432/korxyoutube
```

#### Step 2: 개발 서버 재시작

```powershell
# 현재 서버 중지 (Ctrl+C)
# 그 다음 재시작
npm run dev
```

## ✅ 해결 확인

서버 재시작 후:

1. **브라우저에서 http://localhost:3001 접속**
2. **채널 목록 확인** - 모든 채널에 프로필 이미지가 표시되어야 함
3. **국가 필터 테스트** - 각 국가별로 데이터가 표시되어야 함
4. **브라우저 개발자 도구 (F12) → Console 탭** - 오류가 없어야 함

## 🔍 문제가 계속 발생하는 경우

### 확인 사항

1. **.env.local 파일이 프로젝트 루트에 있는지 확인**
   ```powershell
   Get-Content .env.local
   ```

2. **서버가 재시작되었는지 확인**
   - 서버를 완전히 중지 (Ctrl+C)
   - 다시 시작 (npm run dev)

3. **환경 변수가 제대로 로드되었는지 확인**
   - 브라우저 개발자 도구 → Network 탭
   - `/api/rankings` 요청 확인
   - 응답에서 `apiKeysCount: 3`이 표시되어야 함

## 📝 추가 정보

- `.env.local` 파일은 Git에 커밋되지 않습니다 (보안)
- Next.js는 서버 시작 시 `.env.local` 파일을 자동으로 읽습니다
- PowerShell 환경 변수는 Next.js 서버 프로세스에 전달되지 않습니다
- 따라서 `.env.local` 파일이 필수입니다

## 🆘 여전히 문제가 있다면

1. **로그 확인**: `d:\korxyoutube\.cursor\debug.log` 파일 확인
2. **서버 로그 확인**: 터미널에서 에러 메시지 확인
3. **브라우저 콘솔 확인**: F12 → Console 탭에서 에러 확인



