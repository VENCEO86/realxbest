# 🔄 개발-배포 워크플로우 가이드

## 📋 현재 상황

- **개발 폴더**: `D:\korxyoutube` (현재 개발 중)
- **배포 폴더**: `D:\realxbest` (GitHub + Render 배포됨)

---

## 🎯 추천 워크플로우

### 방법 1: 개발 폴더를 메인으로 사용 (추천! ⭐)

**개념:**
- `D:\korxyoutube`에서 계속 개발
- 개발 완료 후 GitHub에 푸시
- Render는 GitHub 저장소를 직접 연결해서 자동 배포
- `D:\realxbest`는 삭제해도 됨

**장점:**
- ✅ 개발 폴더 하나만 관리
- ✅ GitHub 푸시만 하면 자동 배포
- ✅ 혼동 없음

**작업 순서:**

1. **D:\korxyoutube를 GitHub 저장소로 설정**
   ```bash
   cd d:\korxyoutube
   git init
   git remote add origin https://github.com/VENCEO86/realxbest.git
   ```

2. **최신 변경사항 커밋 및 푸시**
   ```bash
   git add .
   git commit -m "Update from development"
   git push origin main
   ```

3. **Render 자동 배포 확인**
   - Render는 GitHub 저장소를 감시하고 있음
   - 푸시하면 자동으로 재배포 시작

4. **D:\realxbest 폴더 삭제 (선택사항)**
   - 더 이상 필요 없음

---

### 방법 2: 동기화 스크립트 사용

**개념:**
- `D:\korxyoutube`에서 개발
- 배포할 때만 `D:\realxbest`로 복사
- `D:\realxbest`에서 GitHub 푸시

**단점:**
- ⚠️ 수동 작업 필요
- ⚠️ 두 폴더 관리 필요

**동기화 스크립트 예시:**
```powershell
# scripts/sync-to-deploy.ps1
Copy-Item -Path "d:\korxyoutube\*" -Destination "d:\realxbest\" -Recurse -Exclude "node_modules",".next",".git"
cd d:\realxbest
git add .
git commit -m "Sync from development"
git push origin main
```

---

### 방법 3: 하나의 폴더로 통합

**개념:**
- `D:\realxbest`를 메인으로 사용
- `D:\korxyoutube`의 최신 변경사항을 `D:\realxbest`로 이동

**단점:**
- ⚠️ 기존 개발 환경 변경 필요
- ⚠️ 파일 이동 작업 필요

---

## 💡 최종 추천

**방법 1을 강력 추천합니다!**

**이유:**
1. Render는 이미 GitHub 저장소(`VENCEO86/realxbest`)를 연결하고 있음
2. `D:\korxyoutube`에서 개발 → GitHub 푸시 → 자동 배포
3. 폴더 하나만 관리하면 됨
4. 혼동 없음

---

## 📝 실제 워크플로우

### 일상적인 개발 흐름

1. **개발**: `D:\korxyoutube`에서 코드 수정
2. **테스트**: 로컬 서버에서 테스트 (`npm run dev`)
3. **커밋**: 변경사항 커밋
   ```bash
   cd d:\korxyoutube
   git add .
   git commit -m "설명"
   ```
4. **푸시**: GitHub에 푸시
   ```bash
   git push origin main
   ```
5. **자동 배포**: Render가 자동으로 배포 시작
6. **확인**: https://realxbest.onrender.com 에서 확인

---

## 🔧 설정 방법

### 1. D:\korxyoutube를 GitHub 저장소로 설정

```bash
cd d:\korxyoutube

# Git 초기화 (이미 되어 있다면 생략)
git init

# GitHub 저장소 연결
git remote add origin https://github.com/VENCEO86/realxbest.git

# 또는 이미 연결되어 있다면 확인
git remote -v
```

### 2. 최신 변경사항 푸시

```bash
# 현재 상태 확인
git status

# 변경사항 추가
git add .

# 커밋
git commit -m "Sync development changes"

# 푸시 (기존 브랜치 덮어쓰기)
git push -f origin main
```

**⚠️ 주의**: `-f` (force) 옵션은 기존 내용을 덮어씁니다. 신중하게 사용하세요!

---

## 📋 체크리스트

- [ ] D:\korxyoutube에 Git 저장소 설정
- [ ] GitHub 저장소 연결 확인
- [ ] 최신 변경사항 커밋 및 푸시
- [ ] Render 자동 배포 확인
- [ ] D:\realxbest 폴더 정리 (선택사항)

---

## 🎉 완료!

이제 `D:\korxyoutube`에서 개발하고, GitHub에 푸시하면 자동으로 배포됩니다!

**핵심:**
- 개발: `D:\korxyoutube`
- 배포: GitHub 푸시 → Render 자동 배포
- `D:\realxbest`: 더 이상 필요 없음 (삭제 가능)


