# 🎯 YouTube API 키 설정 가이드

## 💡 두 가지 방법

### 방법 1: 하나만 넣기 (간단하지만 제한적)

**설정할 변수:**
- `YOUTUBE_API_KEY` = `AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY`

**장점:**
- ✅ 간단함
- ✅ 빠르게 설정 가능

**단점:**
- ⚠️ 하루에 가져올 수 있는 데이터가 제한적 (10,000 units)
- ⚠️ 많은 데이터를 수집하려면 시간이 오래 걸림

---

### 방법 2: 여러 개 넣기 (추천! 🎯)

**설정할 변수 2개:**

#### 1. YOUTUBE_API_KEY (기본 키)
- **KEY**: `YOUTUBE_API_KEY`
- **VALUE**: `AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY`

#### 2. YOUTUBE_API_KEYS (3개 모두)
- **KEY**: `YOUTUBE_API_KEYS`
- **VALUE**: `AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY,AIzaSyCjxqyzAGEmC21uyXVk1loyvqeOi3fDaB4,AIzaSyBfD3EPz6DL6J_I05fgT9zt3_iyZ39DkpU`
  - 쉼표(,)로 구분해서 3개 키를 모두 입력!

**장점:**
- ✅ 하루에 3배 더 많은 데이터 수집 가능 (30,000 units)
- ✅ 빠른 데이터 수집
- ✅ API 키 순환 사용으로 안정적

**단점:**
- ⚠️ 변수를 하나 더 추가해야 함

---

## 🎯 추천: 방법 2 (여러 개 넣기)

**이유:**
- 우리 프로젝트는 각 국가별로 최소 100개 이상의 채널을 수집해야 해요
- 100개 국가 × 100개 = 최소 10,000개 채널
- 하나의 API 키로는 하루에 충분하지 않을 수 있어요
- 3개를 사용하면 더 빠르고 안정적으로 수집할 수 있어요!

---

## 📝 설정 방법 (방법 2)

### 1단계: YOUTUBE_API_KEY 추가

1. "+ Add" 버튼 클릭
2. **KEY**: `YOUTUBE_API_KEY`
3. **VALUE**: `AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY`
4. 저장

### 2단계: YOUTUBE_API_KEYS 추가

1. "+ Add" 버튼 클릭
2. **KEY**: `YOUTUBE_API_KEYS`
3. **VALUE**: `AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY,AIzaSyCjxqyzAGEmC21uyXVk1loyvqeOi3fDaB4,AIzaSyBfD3EPz6DL6J_I05fgT9zt3_iyZ39DkpU`
   - ⚠️ **주의**: 쉼표(,)로 구분하고, 공백 없이 입력하세요!
4. 저장

---

## 📋 최종 환경 변수 목록

설정 완료 후 총 **5개**의 변수가 있어야 해요:

1. ✅ DATABASE_URL (이미 있음)
2. ✅ YOUTUBE_API_KEY
3. ✅ YOUTUBE_API_KEYS
4. ✅ NEXT_PUBLIC_BASE_URL
5. ✅ NODE_ENV

---

## 💡 참고사항

- **YOUTUBE_API_KEY**: 기본 키 (하나만)
- **YOUTUBE_API_KEYS**: 여러 키 (쉼표로 구분)
- 두 개 모두 설정하면, 코드에서 자동으로 여러 키를 순환 사용해요!
- 하나의 키가 쿼터를 다 쓰면 자동으로 다음 키를 사용해요!

---

## 🎉 완료!

모든 변수를 설정한 후:
- "Save, rebuild, and deploy" 클릭
- 배포 완료 후 웹사이트가 작동해요!

