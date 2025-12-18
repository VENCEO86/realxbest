# 🧹 Render PHP 설정 완전 제거 가이드

## 문제 설명

**오류 메시지:**
```
"php": executable file not found in $PATH
```

**의미:**
- Render가 Start Command로 `php`를 실행하려고 시도
- 하지만 Docker 이미지에는 PHP가 없음 (Node.js 프로젝트)
- 예전 PHP 프로젝트 설정이 Render에 남아있음

## 🎯 해결 방법

### 방법 1: 자동화 스크립트 (권장)

```powershell
# Render API 키 설정
$env:RENDER_API_KEY = "your-api-key-here"

# 스크립트 실행
.\scripts\clean-render-php-settings.ps1
```

### 방법 2: Render 대시보드에서 수동 수정

1. **Render 대시보드 접속**
   - https://dashboard.render.com/web/srv-d48p38jipnbc73dkh990

2. **Settings 탭 클릭**

3. **Build & Start Commands 섹션**
   - **Start Command**: **완전히 비우기** (빈 값)
   - **Build Command**: **완전히 비우기** (빈 값)
   - Dockerfile이 자동으로 사용됨

4. **Runtime 확인**
   - **Runtime**: `Docker` 또는 `Node`로 설정
   - PHP가 선택되어 있으면 변경

5. **Environment Variables 확인**
   - PHP 관련 변수 삭제:
     - `PHP_VERSION`
     - `MYSQL_*` (MySQL 관련 모든 변수)
     - 기타 PHP 관련 변수

6. **저장**

7. **Manual Deploy 실행**

## ✅ 올바른 설정

### Build & Start Commands:
```
Build Command: (비워두기)
Start Command: (비워두기)
```

### Docker 설정:
```
Dockerfile Path: ./Dockerfile
Docker Context: .
```

### Runtime:
```
Docker 또는 Node
```

## 🔍 확인 체크리스트

- [ ] Start Command가 비어있는지 확인
- [ ] Build Command가 비어있는지 확인
- [ ] Runtime이 PHP가 아닌지 확인
- [ ] PHP 관련 환경 변수가 없는지 확인
- [ ] Dockerfile Path가 `./Dockerfile`인지 확인

## 📝 현재 프로젝트 정보

- **프레임워크**: Next.js (Node.js)
- **언어**: TypeScript/JavaScript
- **데이터베이스**: PostgreSQL (Prisma)
- **배포 방식**: Docker

**PHP는 전혀 사용하지 않습니다!**


