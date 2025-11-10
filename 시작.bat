@echo off
chcp 65001 >nul
echo ========================================
echo   그누보드5 로컬 서버 시작
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Docker 컨테이너 시작 중...
docker compose up -d

echo.
echo [2/3] 서버 준비 중... (10초 대기)
timeout /t 10 /nobreak >nul

echo.
echo [3/3] 서버 상태 확인...
docker compose ps

echo.
echo ========================================
echo   서버 시작 완료!
echo ========================================
echo.
echo 📌 접속 정보:
echo.
echo   메인 사이트: http://localhost:8080
echo   관리자 페이지: http://localhost:8080/adm
echo   phpMyAdmin: http://localhost:8081
echo.
echo 📌 관리자 계정:
echo   아이디: admin
echo   비밀번호: admin1234
echo.
echo 📌 데이터베이스 정보:
echo   호스트: localhost:3306
echo   DB명: gnuboard
echo   사용자: gnuboard
echo   비밀번호: gnuboard1234
echo.
echo ========================================
echo.

echo 웹 브라우저로 자동 접속합니다...
timeout /t 3 /nobreak >nul
start http://localhost:8080

pause

