# DATABASE_URL 포트 번호 오류 해결 가이드

## 🔍 에러 메시지

```
❌ Database connection failed: The provided database string is invalid. 
Error parsing connection string: invalid port number in database URL.
```

## 📋 원인 분석

이 에러는 `DATABASE_URL`의 포트 번호가 잘못되었을 때 발생합니다.

### 가능한 원인:
1. **포트 번호가 없음** - Render External Connection String에 포트가 포함되지 않음
2. **포트 번호 형식 오류** - 숫자가 아닌 문자 포함
3. **포트 범위 초과** - 1-65535 범위를 벗어남
4. **특수문자 미인코딩** - URL에 특수문자가 이스케이프되지 않음

---

## ✅ 해결 방법

### 방법 1: Render에서 External Connection String 다시 복사

1. **Render 대시보드 접속**
   - https://dashboard.render.com

2. **PostgreSQL 데이터베이스 선택**

3. **Connection Info 클릭**
   - 데이터베이스 상세 페이지에서 "Connection Info" 버튼 클릭

4. **External Connection String 복사**
   - "External Connection String" 섹션의 값을 복사
   - 형식: `postgresql://user:password@host:port/database`

5. **GitHub Secrets에 업데이트**
   - https://github.com/VENCEO86/realxbest/settings/secrets/actions
   - `DATABASE_URL` 편집
   - 복사한 값을 붙여넣기
   - **중요**: 포트 번호가 포함되어 있는지 확인

---

### 방법 2: 포트 번호 수동 확인 및 수정

#### 올바른 형식:
```
postgresql://user:password@host:5432/database
```

#### 포트 번호 확인:
- Render PostgreSQL 기본 포트: **5432**
- 포트 번호는 1-65535 범위여야 함
- 포트 번호는 숫자만 포함해야 함

#### 예시:
```
✅ 올바름: postgresql://user:pass@dpg-xxxxx-a.oregon-postgres.render.com:5432/dbname
❌ 잘못됨: postgresql://user:pass@dpg-xxxxx-a.oregon-postgres.render.com:port/dbname
❌ 잘못됨: postgresql://user:pass@dpg-xxxxx-a.oregon-postgres.render.com:99999/dbname
```

---

### 방법 3: 특수문자 URL 인코딩

비밀번호에 특수문자가 있는 경우:

| 문자 | 인코딩 |
|------|--------|
| `@` | `%40` |
| `#` | `%23` |
| `%` | `%25` |
| `:` | `%3A` |
| `/` | `%2F` |
| `?` | `%3F` |
| `&` | `%26` |
| `=` | `%3D` |

**예시:**
```
원본: postgresql://user:pass@word@host:5432/db
인코딩: postgresql://user:pass%40word@host:5432/db
```

---

## 🔍 검증 방법

### 1. GitHub Secrets에서 확인
- https://github.com/VENCEO86/realxbest/settings/secrets/actions
- `DATABASE_URL` 편집
- 포트 번호가 포함되어 있는지 확인

### 2. 로컬에서 검증
```bash
# .env.local에 DATABASE_URL 설정
DATABASE_URL="postgresql://user:password@host:port/database"

# 검증 스크립트 실행
npm run verify-secrets
```

### 3. GitHub Actions에서 확인
- 워크플로우 실행 후 "Verify environment variables" 단계 확인
- "Verify database connection" 단계 확인
- 에러 메시지 확인

---

## 📊 개선된 검증 기능

### 자동 검증 항목:
1. ✅ 포트 번호 존재 여부
2. ✅ 포트 번호 형식 (숫자만)
3. ✅ 포트 범위 (1-65535)
4. ✅ 실제 데이터베이스 연결 테스트

### 에러 메시지:
- 포트 번호가 없으면: 기본 포트 5432 사용 안내
- 포트 번호가 잘못되면: 구체적인 해결 방법 제시
- 연결 실패 시: 원인별 해결 방법 제시

---

## 🚀 다음 단계

1. **Render에서 External Connection String 다시 복사**
2. **GitHub Secrets에 업데이트**
3. **워크플로우 다시 실행**
4. **"Verify database connection" 단계 성공 확인**

---

## 💡 참고사항

- Render PostgreSQL의 External Connection String에는 포트 번호가 포함되어 있어야 합니다
- 포트 번호가 없으면 기본 포트 5432를 사용합니다
- 특수문자가 있으면 URL 인코딩이 필요할 수 있습니다
- 검증 스크립트가 자동으로 포트 번호를 확인하고 연결을 테스트합니다

