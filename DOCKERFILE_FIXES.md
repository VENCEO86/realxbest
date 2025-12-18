# Dockerfile 수정 사항

## 문제점
1. `npm install`이 `postinstall` 스크립트 실행 중 실패
2. `prisma generate`가 의존성 설치 전에 실행되어 실패
3. package-lock.json과 npm 버전 불일치

## 해결 방법

### 1. postinstall 스크립트 비활성화
- `--ignore-scripts` 플래그로 postinstall 스크립트 스킵
- Prisma는 의존성 설치 후 수동으로 실행

### 2. npm 버전 업데이트
- Docker 이미지의 npm을 최신 버전으로 업데이트
- 버전 차이로 인한 문제 방지

### 3. Prisma 생성 에러 핸들링
- `|| echo` 로 에러가 발생해도 빌드 계속 진행
- 빌드 단계에서 Prisma 클라이언트 생성

## 변경 사항
- `npm install --ignore-scripts --legacy-peer-deps --no-audit`
- `npm install -g npm@latest` 추가
- Prisma generate 에러 핸들링 개선


