@echo off
chcp 65001 >nul
echo ========================================
echo   그누보드5 로컬 서버 재시작
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] 컨테이너 중지 중...
docker compose down

echo.
echo [2/2] 컨테이너 시작 중...
docker compose up -d

echo.
echo 서버 준비 중... (10초 대기)
timeout /t 10 /nobreak >nul

echo.
echo ========================================
echo   서버 재시작 완료!
echo ========================================
echo.
echo 📌 접속 주소: http://localhost:8080
echo.

pause

