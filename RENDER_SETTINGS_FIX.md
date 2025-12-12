# 🚨 Render 설정 수정 필요 - Start Command 오류

## 문제
Render 서비스가 PHP 시작 명령을 찾고 있습니다:
```
"php": executable file not found in $PATH
```

## 원인
이전 PHP 프로젝트 설정이 남아있어 Start Command가 `php`로 설정되어 있습니다.

## 해결 방법

### Render 대시보드에서 수정:

1. **Render 대시보드 접속**
   - https://dashboard.render.com/web/srv-d48p38jipnbc73dkh990

2. **Settings 탭 클릭**

3. **Build & Start Commands 섹션 확인**

4. **Start Command 비우기**
   - 현재: `php` 또는 다른 PHP 명령어
   - 변경: **비워두기** (Dockerfile의 CMD 사용)

5. **Build Command 확인**
   - 비워두기 (Dockerfile 사용)

6. **저장 후 재배포**
   - "Manual Deploy" 클릭

## 올바른 설정

### Build Command:
```
(비워두기)
```

### Start Command:
```
(비워두기)
```

### Dockerfile Path:
```
./Dockerfile
```

### Docker Context:
```
.
```

## 확인 사항
- ✅ Dockerfile이 프로젝트 루트에 있는지
- ✅ Dockerfile의 CMD가 올바른지 (`node server.js`)
- ✅ Start Command가 비어있는지

