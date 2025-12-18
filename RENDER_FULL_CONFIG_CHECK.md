# 🔍 Render 전체 설정 확인 및 PHP 완전 제거 가이드

## ✅ 확인해야 할 모든 항목

### 1. Settings 탭

#### Docker 설정:
- ✅ **Dockerfile Path**: `./Dockerfile`
- ✅ **Docker Build Context Directory**: `.` (또는 비워두기)
- ✅ **Docker Command**: **비워두기** (Dockerfile의 CMD 사용)
- ✅ **Pre-Deploy Command**: **비워두기**

#### Build & Start Commands:
- ✅ **Build Command**: **완전히 비우기** (빈 값)
- ✅ **Start Command**: **완전히 비우기** (빈 값)

#### Runtime:
- ✅ **Runtime**: `Docker` 또는 `Node`
- ❌ PHP가 선택되어 있으면 반드시 변경!

---

### 2. Environment Variables 탭

#### 삭제해야 할 PHP/MySQL 관련 변수:
- ❌ `PHP_VERSION`
- ❌ `MYSQL_HOST`
- ❌ `MYSQL_PORT`
- ❌ `MYSQL_USER`
- ❌ `MYSQL_PASSWORD`
- ❌ `MYSQL_DB`
- ❌ `DB_HOST`
- ❌ `DB_PORT`
- ❌ `DB_USER`
- ❌ `DB_PASSWORD`
- ❌ `DB_NAME`
- ❌ 기타 PHP/MySQL 관련 변수

#### 유지해야 할 변수:
- ✅ `YOUTUBE_API_KEY`
- ✅ `YOUTUBE_API_KEYS`
- ✅ `NEXT_PUBLIC_BASE_URL`
- ✅ `NEXT_PUBLIC_APP_URL`
- ✅ `NODE_ENV` = `production`
- ✅ `NEXT_TELEMETRY_DISABLED` = `1`
- ✅ `DATABASE_URL` (PostgreSQL 사용 시)

---

### 3. Registry Credential

- ✅ **Registry Credential**: `No credential` (기본값)

---

## 🎯 수정 체크리스트

Render 대시보드에서 다음을 확인하세요:

- [ ] **Settings > Build Command**: 비어있음
- [ ] **Settings > Start Command**: 비어있음
- [ ] **Settings > Runtime**: PHP가 아님 (Docker 또는 Node)
- [ ] **Settings > Docker Command**: 비어있음
- [ ] **Settings > Pre-Deploy Command**: 비어있음
- [ ] **Environment Variables**: PHP 관련 변수 없음
- [ ] **Environment Variables**: MySQL 관련 변수 없음 (DATABASE_URL 제외)

---

## 🚀 수정 후 재배포

1. 모든 설정 확인 및 수정 완료
2. **Manual Deploy** 클릭
3. 배포 완료 대기 (약 5-7분)
4. `https://realxbest.com` 접속 테스트

---

## 📝 현재 프로젝트 정보

- **프레임워크**: Next.js 14
- **언어**: TypeScript/JavaScript
- **런타임**: Node.js
- **데이터베이스**: PostgreSQL (Prisma)
- **배포 방식**: Docker

**PHP는 전혀 사용하지 않습니다!**

---

## ⚠️ 주의사항

- Dockerfile을 사용할 때는 **반드시** Build Command와 Start Command를 비워야 합니다
- Dockerfile의 `CMD ["node", "server.js"]`가 자동으로 사용됩니다
- PHP 관련 설정이 하나라도 남아있으면 오류가 발생합니다


