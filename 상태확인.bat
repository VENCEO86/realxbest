@echo off
chcp 65001 >nul
echo ========================================
echo   그누보드5 서버 상태 확인
echo ========================================
echo.

cd /d "%~dp0"

echo [Docker 컨테이너 상태]
echo ----------------------------------------
docker compose ps
echo.

echo [웹 서버 접속 테스트]
echo ----------------------------------------
curl -s -o nul -w "메인 페이지 (http://localhost:8080): %%{http_code}\n" http://localhost:8080
curl -s -o nul -w "관리자 페이지 (http://localhost:8080/adm/): %%{http_code}\n" http://localhost:8080/adm/
curl -s -o nul -w "phpMyAdmin (http://localhost:8081): %%{http_code}\n" http://localhost:8081
echo.

echo [데이터베이스 연결 테스트]
echo ----------------------------------------
docker exec gnuboard_db mysql -ugnuboard -pgnuboard1234 gnuboard -e "SELECT '✅ 데이터베이스 연결 정상' as status;" 2>nul || echo ❌ 데이터베이스 연결 실패
echo.

echo ========================================
echo   상태 확인 완료
echo ========================================
echo.
echo 💡 HTTP 상태 코드:
echo    200 = 정상
echo    301/302 = 리다이렉트 (정상)
echo    500 = 서버 오류
echo    000 = 서버 응답 없음
echo.

pause

