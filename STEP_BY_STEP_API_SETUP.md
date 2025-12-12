# 🎯 API 키 설정 단계별 가이드

## 현재 상태
✅ API 키가 생성되었습니다!
이제 보안 설정과 다음 단계를 진행합니다.

---

## 📋 Step 1: API 키 보안 설정 (권장)

### 1-1. API 제한사항 설정

현재 화면에서:

1. **"API 제한사항"** 섹션 찾기
2. **"키 제한"** 라디오 버튼 선택
3. 드롭다운에서 **"YouTube Data API v3"** 선택
   - 여러 개가 보이면 "YouTube Data API v3"만 체크
4. **"저장"** 버튼 클릭

⚠️ **왜 필요한가요?**
- API 키가 유출되어도 YouTube API만 사용 가능
- 다른 Google 서비스는 사용 불가 (보안 강화)

### 1-2. 애플리케이션 제한사항 (선택사항)

- **"없음"** 그대로 두셔도 됩니다
- 또는 **"IP 주소"** 선택하여 서버 IP만 허용 가능

---

## 📋 Step 2: API 키 복사

1. 오른쪽 **"추가 정보"** 섹션에서
2. **"키 표시"** 버튼 클릭 (눈 아이콘)
3. 표시된 API 키를 **전체 복사** (Ctrl+C)
   - 예: `AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567`
4. ⚠️ **안전한 곳에 저장** (나중에 다시 볼 수 없을 수 있음)

---

## 📋 Step 3: 환경 변수 설정

### Windows PowerShell에서 실행:

```powershell
# 1. API 키 환경 변수 설정
$env:YOUTUBE_API_KEY="여기에_복사한_API_키_붙여넣기"

# 2. 확인 (키가 표시되면 성공)
echo $env:YOUTUBE_API_KEY

# 3. 데이터베이스 URL 설정 (PostgreSQL이 있다면)
# 없으면 Mock 데이터로 테스트 가능
$env:DATABASE_URL="postgresql://user:password@localhost:5432/korxyoutube"
```

### 영구 설정 (선택사항):

`.env` 파일 생성 (프로젝트 루트에):

```env
YOUTUBE_API_KEY=여기에_복사한_API_키_붙여넣기
DATABASE_URL=postgresql://user:password@localhost:5432/korxyoutube
```

---

## 📋 Step 4: 데이터베이스 확인

### 옵션 A: PostgreSQL 사용 (실제 데이터 저장)

```powershell
# 데이터베이스 마이그레이션
npm run db:push
```

### 옵션 B: 데이터베이스 없이 테스트 (Mock 데이터)

데이터베이스가 없어도 Mock 데이터로 테스트 가능합니다.
현재 코드가 자동으로 Mock 데이터를 사용합니다.

---

## 📋 Step 5: 실제 채널 데이터 수집

### 5-1. 인기 채널 ID 목록 확인

`scripts/fetch-youtube-channels.ts` 파일에 이미 몇 개의 채널 ID가 있습니다:

- PewDiePie: `UC-lHJZR3Gqxm24_Vd_AJ5Yw`
- MrBeast: `UCX6OQ3DkcsbYNE6H8uQQuVA`
- 등등...

### 5-2. 데이터 수집 실행

```powershell
# 환경 변수가 설정되어 있는지 확인
echo $env:YOUTUBE_API_KEY

# 데이터 수집 실행
npm run fetch-channels
```

### 5-3. 결과 확인

성공하면:
```
✓ PewDiePie 저장 완료
✓ MrBeast 저장 완료
...
완료! 8/8개 채널이 저장되었습니다.
```

---

## 📋 Step 6: 브라우저에서 확인

```powershell
# 개발 서버가 실행 중이면 그대로 사용
# 아니면 시작
npm run dev
```

브라우저에서:
1. `http://localhost:3001` 접속
2. 채널 목록이 표시되는지 확인
3. 채널 클릭하여 상세 페이지 확인
4. 국가별 필터 테스트

---

## 🆘 문제 해결

### "API 키가 유효하지 않습니다"
- API 키에 따옴표 없이 입력했는지 확인
- YouTube Data API v3가 활성화되었는지 확인

### "할당량 초과"
- 일일 10,000 units 제한
- 내일 다시 시도하거나 여러 API 키 사용

### "채널을 찾을 수 없습니다"
- 채널 ID가 올바른지 확인
- 채널이 삭제되지 않았는지 확인

---

## ✅ 체크리스트

- [ ] Step 1: API 제한사항 설정 완료
- [ ] Step 2: API 키 복사 완료
- [ ] Step 3: 환경 변수 설정 완료
- [ ] Step 4: 데이터베이스 확인 완료
- [ ] Step 5: 데이터 수집 실행 완료
- [ ] Step 6: 브라우저에서 확인 완료

---

## 🚀 다음 단계

데이터 수집이 완료되면:
1. 더 많은 채널 추가
2. 국가별 채널 수집
3. 정기 업데이트 스크립트 설정


