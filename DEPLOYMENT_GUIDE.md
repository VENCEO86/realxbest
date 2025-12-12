# 🚀 GitHub + Render 배포 가이드

## 현재 상태
✅ 프로젝트 파일 복사 완료 (D:\korxyoutube → D:\realxbest)
✅ Git 저장소 초기화 완료
✅ 첫 커밋 완료

---

## 📋 배포 단계

### 1. GitHub 저장소 생성

1. **GitHub 접속**: https://github.com/new
2. **저장소 정보 입력**:
   - Repository name: `korxyoutube` (또는 원하는 이름)
   - Description: `YouTube Ranking & Analysis Platform`
   - Public 또는 Private 선택
   - ⚠️ **중요**: "Initialize this repository with:" 체크박스 모두 해제
3. **Create repository** 클릭

### 2. GitHub 저장소 연결

```bash
cd d:\realxbest

# GitHub 저장소 URL 연결 (사용자명과 저장소명 변경 필요)
git remote add origin https://github.com/사용자명/저장소명.git

# 코드 푸시
git push -u origin main
```

### 3. Render에서 Web Service 생성

1. **Render 대시보드 접속**: https://dashboard.render.com
2. **New +** 버튼 클릭 → **Web Service** 선택
3. **GitHub 저장소 연결**:
   - "Connect GitHub" 클릭
   - 저장소 선택 (korxyoutube)
   - "Connect" 클릭
4. **서비스 설정**:
   - **Name**: `korxyoutube` (또는 원하는 이름)
   - **Region**: `Oregon (US West)` (또는 가까운 지역)
   - **Branch**: `main`
   - **Root Directory**: (비워두기)
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free` (또는 원하는 플랜)

### 4. 환경 변수 설정 (Render)

Render 대시보드에서 생성한 Web Service의 **Environment** 탭에서 다음 변수 추가:

```
DATABASE_URL=postgresql://user:password@host:port/database
YOUTUBE_API_KEY=your-youtube-api-key
YOUTUBE_API_KEYS=key1,key2,key3
NEXT_PUBLIC_BASE_URL=https://your-app-name.onrender.com
NODE_ENV=production
```

**중요**:
- `DATABASE_URL`: Render에서 생성한 PostgreSQL 데이터베이스의 External Connection String 사용
- `YOUTUBE_API_KEY`: YouTube Data API v3 키
- `NEXT_PUBLIC_BASE_URL`: Render에서 제공하는 배포 URL

### 5. PostgreSQL 데이터베이스 생성 (Render)

1. **Render 대시보드** → **New +** → **PostgreSQL**
2. **데이터베이스 설정**:
   - **Name**: `korxyoutube-db`
   - **Database**: `korxyoutube`
   - **User**: (자동 생성)
   - **Region**: Web Service와 동일한 지역 선택
   - **Plan**: `Free` (또는 원하는 플랜)
3. **생성 후**:
   - **Connection Info** → **External Connection String** 복사
   - Web Service의 `DATABASE_URL` 환경 변수에 설정

### 6. Prisma 마이그레이션 (로컬 또는 Render)

**옵션 A: 로컬에서 실행**
```bash
cd d:\realxbest
npx prisma db push
```

**옵션 B: Render에서 실행**
- Render 대시보드 → Web Service → **Shell** 탭
- 다음 명령어 실행:
```bash
npx prisma db push
```

### 7. 배포 확인

1. Render 대시보드에서 배포 상태 확인
2. 배포 완료 후 제공된 URL로 접속 테스트
3. 로그 확인: **Logs** 탭에서 오류 확인

---

## 🔧 문제 해결

### 빌드 실패 시

1. **로그 확인**: Render 대시보드 → Logs 탭
2. **일반적인 문제**:
   - 환경 변수 누락
   - Prisma 스키마 오류
   - 의존성 설치 실패

### 데이터베이스 연결 실패 시

1. `DATABASE_URL` 환경 변수 확인
2. PostgreSQL 데이터베이스가 실행 중인지 확인
3. External Connection String 사용 확인

### API 키 오류 시

1. `YOUTUBE_API_KEY` 환경 변수 확인
2. YouTube API 쿼터 확인
3. API 키 제한사항 확인

---

## 📝 체크리스트

- [ ] GitHub 저장소 생성
- [ ] 로컬 Git 저장소와 GitHub 연결
- [ ] 코드 푸시 완료
- [ ] Render Web Service 생성
- [ ] Render PostgreSQL 데이터베이스 생성
- [ ] 환경 변수 설정 완료
- [ ] Prisma 마이그레이션 실행
- [ ] 배포 성공 확인
- [ ] 사이트 접속 테스트

---

## 💡 참고사항

- Render Free 플랜은 15분 비활성 시 서비스가 슬립 모드로 전환됩니다
- 첫 배포는 다소 시간이 걸릴 수 있습니다 (5-10분)
- 환경 변수 변경 시 자동 재배포가 트리거됩니다
- `package.json`의 `scripts` 섹션에 `start` 명령어가 있는지 확인하세요

---

## 🎉 배포 완료 후

배포가 성공하면:
1. Render에서 제공하는 URL로 접속 가능
2. GitHub에 코드 변경사항 푸시 시 자동 재배포
3. Render 대시보드에서 로그 및 모니터링 확인 가능

