# 그누보드5 로컬 접속 정보

## 🚀 간편 서버 시작 방법

### Windows (권장)
`시작.bat` 파일을 더블클릭하세요.
- 자동으로 서버를 시작하고 브라우저를 엽니다.

### 또는 명령어 실행
```bash
docker compose up -d
```

## 🌐 접속 주소

### 메인 웹사이트
- **URL**: http://localhost:8080
- 그누보드5 메인 페이지입니다.

### 관리자 페이지
- **URL**: http://localhost:8080/adm
- **아이디**: admin
- **비밀번호**: admin1234

### phpMyAdmin (데이터베이스 관리)
- **URL**: http://localhost:8081
- **서버**: db
- **사용자명**: gnuboard
- **비밀번호**: gnuboard1234

## 📦 데이터베이스 정보

- **호스트**: db (컨테이너 내부) / localhost:3306 (외부 접속)
- **데이터베이스명**: gnuboard
- **사용자명**: gnuboard
- **비밀번호**: gnuboard1234
- **Root 비밀번호**: root1234

## 🛠️ Docker 컨테이너

| 컨테이너명 | 서비스 | 포트 |
|-----------|--------|------|
| gnuboard_web | Apache + PHP 8.2 | 8080 |
| gnuboard_db | MySQL 8.0 | 3306 |
| gnuboard_phpmyadmin | phpMyAdmin | 8081 |

## 📝 주요 명령어

### 컨테이너 시작
```bash
docker compose up -d
```

### 컨테이너 중지
```bash
docker compose down
```

### 컨테이너 재시작
```bash
docker compose restart
```

### 로그 확인
```bash
docker compose logs -f
```

### 컨테이너 상태 확인
```bash
docker compose ps
```

## 🎨 테마 및 스킨

- **기본 테마**: ETY_v1.3
- **모바일**: 지원
- **반응형**: 지원

## 📂 주요 디렉토리

- `/adm` - 관리자 페이지
- `/data` - 업로드 파일 및 캐시
- `/theme` - 테마 파일
- `/skin` - 스킨 파일
- `/plugin` - 플러그인

## 🔧 문제 해결

### 데이터베이스 연결 오류
```bash
docker compose restart db
```

### 권한 오류
```bash
docker exec gnuboard_web chown -R www-data:www-data /var/www/html/data
docker exec gnuboard_web chmod -R 777 /var/www/html/data/cache
```

### 전체 재시작
```bash
docker compose down -v
docker compose up -d
```

## ✅ 설치 완료 확인

1. 웹 브라우저에서 http://localhost:8080 접속
2. 메인 페이지가 정상적으로 표시되는지 확인
3. http://localhost:8080/adm 에서 관리자로 로그인
4. 모든 기능이 정상 작동하는지 확인

---

**설치 완료!** 🎉

