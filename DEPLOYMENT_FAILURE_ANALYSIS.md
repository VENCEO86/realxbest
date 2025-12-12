# 배포 실패 원인 분석

## 🔍 문제 분석

### 실패 지점
- **Dockerfile 11번째 줄**: `RUN npm ci`
- **오류 코드**: `exit code: 1`
- **오류 메시지**: `process "/bin/sh -c npm ci" did not complete successfully`

### 근본 원인

1. **`npm ci`의 엄격한 의존성 검증**
   - `npm ci`는 package-lock.json을 엄격하게 따름
   - peer dependency 충돌 시 실패함
   - `--legacy-peer-deps` 플래그를 지원하지 않음 (npm 7+)

2. **의존성 충돌**
   - `eslint-config-next@16.0.8`과 `eslint@8.57.0` 간 호환성 문제
   - package-lock.json이 로컬에서 `--legacy-peer-deps`로 생성됨
   - Docker 환경에서는 엄격한 검증으로 실패

3. **npm 버전 차이**
   - 로컬: npm 11.5.1
   - Docker (node:20-alpine): npm 10.x
   - 버전 차이로 인한 동작 차이

## ✅ 해결 방법

### 방법 1: `npm install` 사용 (권장)
- `npm ci` 대신 `npm install --legacy-peer-deps` 사용
- 더 유연한 의존성 해결

### 방법 2: package-lock.json 재생성
- 로컬에서 `npm install --legacy-peer-deps`로 재생성
- 하지만 여전히 Docker에서 문제 발생 가능

### 방법 3: Dockerfile 개선
- npm 버전 명시
- 더 견고한 fallback 로직 추가

