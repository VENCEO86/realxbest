@echo off
chcp 65001 >nul
echo ========================================
echo   관리자 페이지 열기
echo ========================================
echo.
echo 📌 관리자 로그인 정보:
echo.
echo   URL: http://localhost:8080/adm/
echo   아이디: admin
echo   비밀번호: admin1234
echo.
echo ========================================
echo.

timeout /t 2 /nobreak >nul
start http://localhost:8080/adm/

echo 관리자 페이지가 열렸습니다!
echo.
pause



