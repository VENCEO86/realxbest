# Next.js 프로덕션 빌드를 위한 Dockerfile
FROM node:20-alpine AS base

# 의존성 설치 단계 (캐시 최적화)
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl python3 make g++
WORKDIR /app

# package.json과 package-lock.json 복사 (캐시 활용)
COPY package.json package-lock.json* ./

# 의존성 설치 (캐시 최적화)
# --ignore-scripts: postinstall 스크립트 스킵 (Prisma는 나중에)
# --legacy-peer-deps: peer dependency 충돌 무시
# --no-audit: 보안 감사 스킵 (빌드 속도 향상)
RUN npm ci --ignore-scripts --legacy-peer-deps --no-audit --prefer-offline || \
    npm install --ignore-scripts --legacy-peer-deps --no-audit --prefer-offline

# 빌드 단계
FROM base AS builder
WORKDIR /app

# 빌드 단계에서도 OpenSSL 라이브러리 필요
RUN apk add --no-cache openssl1.1-compat openssl-libs-compat libc6-compat || \
    apk add --no-cache openssl1.1 libc6-compat || \
    apk add --no-cache openssl libc6-compat

COPY --from=deps /app/node_modules ./node_modules

# package.json과 package-lock.json 복사 (빌드 스크립트 실행에 필요)
COPY package.json package-lock.json* ./

# 소스 코드 복사 (캐시 최적화: 변경이 적은 파일 먼저)
COPY next.config.mjs ./
COPY tsconfig.json ./
COPY tailwind.config.ts ./
COPY postcss.config.mjs ./
COPY prisma ./prisma

# Prisma 클라이언트 생성 (스키마 변경 시에만 재실행)
RUN npx prisma generate --schema=./prisma/schema.prisma

# 나머지 소스 코드 복사 (변경이 많은 파일)
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY public ./public

# 환경 변수 설정 (빌드 시점)
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Next.js 빌드 실행
# package.json이 이미 복사되어 있으므로 npm run build가 정상 작동함
RUN npm run build

# 프로덕션 실행 단계
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Prisma 엔진 실행을 위한 필수 라이브러리 설치
# Alpine Linux에서 Prisma는 openssl1.1-compat가 필요
RUN apk add --no-cache openssl1.1-compat openssl1.1 libc6-compat && \
    # 라이브러리 경로 확인
    echo "=== OpenSSL 라이브러리 확인 ===" && \
    ls -la /usr/lib/libssl* /usr/lib/libcrypto* /lib/libssl* /lib/libcrypto* 2>/dev/null || true && \
    # libssl.so.1.1이 있는지 확인하고 심볼릭 링크 생성
    (test -f /usr/lib/libssl.so.1.1 && ln -sf /usr/lib/libssl.so.1.1 /usr/lib/libssl.so.1.1 || \
     test -f /lib/libssl.so.1.1 && ln -sf /lib/libssl.so.1.1 /usr/lib/libssl.so.1.1 || \
     echo "Warning: libssl.so.1.1 not found") && \
    # libcrypto.so.1.1이 있는지 확인하고 심볼릭 링크 생성
    (test -f /usr/lib/libcrypto.so.1.1 && ln -sf /usr/lib/libcrypto.so.1.1 /usr/lib/libcrypto.so.1.1 || \
     test -f /lib/libcrypto.so.1.1 && ln -sf /lib/libcrypto.so.1.1 /usr/lib/libcrypto.so.1.1 || \
     echo "Warning: libcrypto.so.1.1 not found") && \
    # 최종 확인
    echo "=== 최종 라이브러리 확인 ===" && \
    ls -la /usr/lib/libssl.so.1.1 /usr/lib/libcrypto.so.1.1 2>/dev/null || \
    (echo "Error: Required libraries not found" && find /usr/lib /lib -name "*ssl*" -o -name "*crypto*" 2>/dev/null | head -20)

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Next.js 빌드 결과물 복사 (standalone 모드)
# standalone 빌드는 .next/standalone 폴더에 모든 파일을 생성함
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma 클라이언트 복사 (런타임에 필요)
# standalone 모드에서는 node_modules가 포함되지 않으므로 수동 복사 필요
# Prisma 엔진 바이너리도 함께 복사
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Prisma 엔진 바이너리 확인 및 심볼릭 링크 생성 (필요시)
RUN ls -la /app/node_modules/.prisma/client/ || echo "Prisma client directory not found" && \
    ls -la /app/node_modules/@prisma/client/ || echo "@prisma/client directory not found" && \
    # Prisma 엔진 바이너리 확인
    find /app/node_modules/.prisma -name "query-engine-*" -type f || echo "No query engine found" && \
    find /app/node_modules/@prisma -name "query-engine-*" -type f || echo "No query engine found in @prisma"

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# standalone 모드에서는 server.js가 루트에 생성됨
CMD ["node", "server.js"]

