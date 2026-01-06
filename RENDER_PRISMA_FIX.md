# 🔧 Render Prisma Client 오류 해결

## ❌ 문제 발견

### 오류 메시지
```
Prisma Client could not locate the Query Engine for runtime "linux-musl".

This happened because Prisma Client was generated for "linux-musl-openssl-3.0.x", 
but the actual deployment...

Add "linux-musl" to 'binaryTargets' in the "schema.prisma" file and run 'prisma generate' 
after saving it.
```

### 원인 분석

1. **Docker 이미지 환경**
   - Dockerfile에서 `node:20-alpine` 사용
   - Alpine Linux는 `linux-musl` 런타임 사용

2. **Prisma Client 생성 문제**
   - 기본적으로 `native` 타겟만 생성됨
   - `linux-musl` 타겟이 없어서 런타임에서 찾을 수 없음

3. **Render 배포 실패**
   - Prisma Client가 Query Engine을 찾지 못함
   - 데이터베이스 연결 실패
   - 웹사이트 작동 불가

---

## ✅ 해결 방법

### 1. schema.prisma 수정

**수정 전**:
```prisma
generator client {
  provider = "prisma-client-js"
}
```

**수정 후**:
```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "linux-musl", "linux-musl-openssl-3.0.x"]
}
```

### 2. Prisma Client 재생성

```bash
npx prisma generate
```

### 3. 변경사항 커밋 및 푸시

```bash
git add prisma/schema.prisma
git commit -m "fix: Prisma Client binaryTargets 추가 - Render 배포 오류 해결"
git push origin main
```

---

## 📋 binaryTargets 설명

### 지원하는 타겟

1. **native**
   - 로컬 개발 환경 (Windows, macOS, Linux)
   - 개발 시 사용

2. **linux-musl**
   - Alpine Linux 런타임
   - Render 배포 환경 (Docker Alpine 이미지)

3. **linux-musl-openssl-3.0.x**
   - Alpine Linux OpenSSL 3.0.x 런타임
   - 최신 Alpine Linux 버전 지원

---

## 🎯 효과

### 해결된 문제

- ✅ Prisma Client가 linux-musl 런타임을 찾을 수 있음
- ✅ Render 배포 시 데이터베이스 연결 정상 작동
- ✅ 웹사이트 정상 작동
- ✅ 데이터베이스 쿼리 정상 실행

### 배포 후 확인 사항

1. **Render 로그 확인**
   - Prisma 오류 메시지가 사라졌는지 확인
   - 데이터베이스 연결 성공 메시지 확인

2. **웹사이트 동작 확인**
   - 메인 페이지 로드 확인
   - 채널 목록 표시 확인
   - 데이터베이스 쿼리 정상 작동 확인

---

## 🔍 추가 확인 사항

### Dockerfile 확인

Dockerfile에서 Prisma Client 생성이 올바르게 되는지 확인:

```dockerfile
# Prisma 클라이언트 생성 (스키마 변경 시에만 재실행)
RUN npx prisma generate --schema=./prisma/schema.prisma
```

### 배포 후 테스트

1. Render 대시보드에서 배포 상태 확인
2. 로그에서 Prisma 오류 메시지 확인
3. 웹사이트 접속하여 정상 작동 확인

---

## 📝 참고

- Prisma Client는 여러 binaryTargets를 지원하므로, 여러 환경에서 사용 가능
- binaryTargets를 추가하면 Prisma Client 크기가 약간 증가하지만, 배포 환경 호환성 확보
- 로컬 개발 환경과 배포 환경이 다를 경우, binaryTargets에 두 환경 모두 추가 필요

