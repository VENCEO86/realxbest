# 🔧 GitHub Actions 워크플로우 수정 사항

## 🚨 발견된 문제점

### 문제 1: `tsx` 직접 실행
- **원인**: `tsx scripts/daily-auto-collect.ts` 직접 실행 시 경로 문제 가능
- **해결**: `npm run collect:daily` 사용 (package.json에 정의된 스크립트)

### 문제 2: Prisma Client 미생성
- **원인**: Prisma Client가 생성되지 않으면 스크립트 실행 실패
- **해결**: `npx prisma generate` 단계 추가

### 문제 3: Peer dependency 충돌
- **원인**: `npm ci` 실행 시 peer dependency 충돌 가능
- **해결**: `npm ci --legacy-peer-deps` 사용

---

## ✅ 수정된 워크플로우

### 주요 변경사항

1. **의존성 설치 개선**
   ```yaml
   - name: Install dependencies
     run: npm ci --legacy-peer-deps
   ```

2. **Prisma Client 생성 추가**
   ```yaml
   - name: Generate Prisma Client
     env:
       DATABASE_URL: ${{ secrets.DATABASE_URL }}
     run: npx prisma generate
   ```

3. **스크립트 실행 방법 변경**
   ```yaml
   # 변경 전
   run: tsx scripts/daily-auto-collect.ts
   
   # 변경 후
   run: npm run collect:daily
   ```

---

## 📋 수정된 전체 워크플로우

```yaml
name: Daily Channel Collection

on:
  schedule:
    - cron: '0 18 * * *'  # 매일 실행 (주말 포함)
  workflow_dispatch: # 수동 실행 가능

jobs:
  collect:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci --legacy-peer-deps
      
      - name: Generate Prisma Client
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: npx prisma generate
      
      - name: Setup database
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: npm run db:setup
      
      - name: Run daily collection
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          YOUTUBE_API_KEYS: ${{ secrets.YOUTUBE_API_KEYS }}
        run: npm run collect:daily
```

---

## 🔍 실패 원인 분석

### 가능한 실패 원인들

1. **Prisma Client 미생성**
   - 오류: `Cannot find module '@prisma/client'`
   - 해결: `npx prisma generate` 단계 추가

2. **tsx 경로 문제**
   - 오류: `tsx: command not found` 또는 경로 오류
   - 해결: `npm run collect:daily` 사용

3. **Peer dependency 충돌**
   - 오류: `npm ERR! peer dep missing` 또는 설치 실패
   - 해결: `--legacy-peer-deps` 플래그 추가

4. **환경 변수 미전달**
   - 오류: `Environment variable not found: DATABASE_URL`
   - 해결: 각 step에 `env` 섹션 확인

---

## ✅ 수정 후 테스트

1. **변경사항 커밋 및 푸시**
   ```bash
   git add .github/workflows/daily-collect.yml
   git commit -m "fix: Improve GitHub Actions workflow - Add Prisma generate and use npm scripts"
   git push origin main
   ```

2. **Actions에서 수동 실행**
   - https://github.com/VENCEO86/realxbest/actions
   - "Daily Channel Collection" 클릭
   - "Run workflow" 버튼 클릭

3. **실행 로그 확인**
   - 실행 항목 클릭
   - 각 step의 로그 확인
   - 성공 여부 확인

---

## 💡 추가 개선 사항

### 에러 핸들링 개선 (선택사항)

```yaml
- name: Run daily collection
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    YOUTUBE_API_KEYS: ${{ secrets.YOUTUBE_API_KEYS }}
  run: npm run collect:daily
  continue-on-error: false  # 실패 시 중단
```

### 타임아웃 설정 (선택사항)

```yaml
jobs:
  collect:
    runs-on: ubuntu-latest
    timeout-minutes: 60  # 최대 60분 실행
```

---

## 📊 예상 실행 시간

- Checkout: ~10초
- Setup Node.js: ~10초
- Install dependencies: ~2-3분
- Generate Prisma Client: ~10초
- Setup database: ~5초
- Run daily collection: ~10-30분 (데이터 양에 따라)

**총 예상 시간**: 약 15-35분

---

## ✅ 수정 완료

워크플로우 파일이 수정되었습니다. 변경사항을 푸시하고 다시 테스트하세요!


