# 📁 폴더명 변경 가이드

## 🎯 목표

`D:\korxyoutube` → `D:\realxbest`로 변경하여 모든 이름을 통일합니다!

---

## 📋 현재 상태

- ✅ 기존 `D:\realxbest` 백업 완료: `D:\realxbest-backup-20251212-150327`
- ⏳ `D:\korxyoutube` → `D:\realxbest` 변경 필요

---

## 🔧 변경 방법

### 방법 1: 파일 탐색기에서 변경 (가장 쉬움!)

1. **모든 에디터 종료**
   - Cursor 종료
   - VS Code 종료
   - 기타 에디터 종료

2. **파일 탐색기 열기**
   - `Win + E` 또는 파일 탐색기 아이콘 클릭

3. **D:\korxyoutube 폴더 찾기**
   - 왼쪽에서 D: 드라이브 선택
   - korxyoutube 폴더 찾기

4. **이름 변경**
   - `korxyoutube` 폴더를 **우클릭**
   - **"이름 바꾸기"** 선택
   - `realxbest`로 입력
   - Enter 키 누르기

5. **완료!** ✅

---

### 방법 2: PowerShell에서 변경

1. **모든 에디터 종료**

2. **PowerShell 새로 열기**
   - `Win + X` → "Windows PowerShell" 또는 "터미널"

3. **명령어 실행**
   ```powershell
   Rename-Item -Path "d:\korxyoutube" -NewName "realxbest"
   ```

4. **확인**
   ```powershell
   cd d:\realxbest
   git remote -v
   ```

5. **완료!** ✅

---

## ✅ 변경 후 확인

변경이 완료되면:

1. **폴더 확인**
   ```
   D:\realxbest 폴더가 존재하는지 확인
   ```

2. **Git 확인**
   ```bash
   cd d:\realxbest
   git remote -v
   ```
   - `origin	https://github.com/VENCEO86/realxbest.git` 가 보여야 함

3. **프로젝트 확인**
   ```bash
   npm run dev
   ```
   - 정상적으로 실행되는지 확인

---

## 🎉 완료!

변경이 완료되면:

- ✅ 폴더명: `D:\realxbest`
- ✅ GitHub 저장소: `VENCEO86/realxbest`
- ✅ Render 서비스: `realxbest`
- ✅ 도메인: `realxbest.onrender.com`

**모든 이름이 통일되었습니다!** 🎊

---

## 💡 참고사항

- 폴더명 변경은 Git에 영향을 주지 않습니다
- GitHub 저장소 연결도 그대로 유지됩니다
- 프로젝트 파일도 그대로 유지됩니다
- 단지 폴더 이름만 변경되는 것입니다!

---

## 🆘 문제 해결

### "폴더가 사용 중입니다" 오류

**원인:**
- Cursor나 다른 프로그램에서 폴더를 열고 있음

**해결:**
1. 모든 에디터 종료
2. 작업 관리자에서 관련 프로세스 종료
3. 다시 시도

### "권한이 없습니다" 오류

**해결:**
1. 관리자 권한으로 PowerShell 실행
2. 또는 파일 탐색기에서 관리자 권한으로 실행

---

## 📝 변경 후 워크플로우

변경 완료 후:

1. **개발**: `D:\realxbest`에서 코드 수정
2. **테스트**: `npm run dev`
3. **커밋**: `git add . && git commit -m "설명"`
4. **푸시**: `git push origin main`
5. **자동 배포**: Render가 자동으로 배포

**완벽하게 통일되었습니다!** 🎉


