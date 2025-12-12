# Next.js 프로덕션 빌드를 위한 Dockerfile
FROM node:20-alpine AS base

# 의존성 설치 단계
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl python3 make g++
WORKDIR /app

# package.json만 복사 (package-lock.json 무시 - Docker에서 재생성)
COPY package.json ./

# npm 캐시 클리어 및 최신 버전 설치
RUN npm cache clean --force && \
    npm install -g npm@latest

# 의존성 설치 (package-lock.json 없이 깨끗한 설치)
# --ignore-scripts: postinstall 스크립트 스킵
# --legacy-peer-deps: peer dependency 충돌 무시
# --no-audit: 보안 감사 스킵
# --prefer-offline: 오프라인 캐시 우선 사용
RUN npm install --ignore-scripts --legacy-peer-deps --no-audit --prefer-offline || \
    npm install --ignore-scripts --legacy-peer-deps --no-audit

# 빌드 단계
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma 클라이언트 생성 (의존성 설치 후 수동 실행)
RUN npx prisma generate || echo "Prisma generate failed, continuing..."

# 환경 변수 설정 (빌드 시점)
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Next.js 빌드 실행
RUN npm run build

# 프로덕션 실행 단계
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Next.js 빌드 결과물 복사 (standalone 모드)
# standalone 빌드는 .next/standalone 폴더에 모든 파일을 생성함
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# standalone 모드에서는 server.js가 루트에 생성됨
CMD ["node", "server.js"]

