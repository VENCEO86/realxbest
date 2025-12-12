# 🎓 Render 환경 변수 설정 - 초등학생도 할 수 있어요!

## 🎯 지금 해야 할 일

화면을 보니 **DATABASE_URL**은 이미 추가되어 있네요!
이제 나머지 **3개만** 추가하면 끝이에요!

---

## 📝 차근차근 따라하기

### 1번째: YOUTUBE_API_KEY 추가하기

**이게 뭐예요?**
- YouTube에서 데이터를 가져오는 "열쇠"예요
- 없으면 YouTube 데이터를 못 가져와요!

**어떻게 하나요?**

1. 화면 아래를 보세요
   - **"+ Add"** 버튼이 보일 거예요
   - 보통 왼쪽 아래에 있어요

2. **"+ Add"** 버튼을 클릭하세요
   - 클릭하면 두 개의 빈 칸이 나타날 거예요

3. 왼쪽 칸에 입력:
   ```
   YOUTUBE_API_KEY
   ```
   - 정확히 이렇게 입력하세요!
   - 대문자로!

4. 오른쪽 칸에 입력:
   ```
   AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY
   ```
   - 이건 YouTube 열쇠예요!

5. 다른 곳을 클릭하거나 Enter를 누르세요
   - 자동으로 저장돼요!

**✅ 완료!** 1번째 끝!

---

### 2번째: NEXT_PUBLIC_BASE_URL 추가하기

**이게 뭐예요?**
- 우리 웹사이트 주소예요!
- "우리 집 주소" 같은 거예요

**어떻게 하나요?**

1. 다시 **"+ Add"** 버튼을 클릭하세요

2. 왼쪽 칸에 입력:
   ```
   NEXT_PUBLIC_BASE_URL
   ```

3. 오른쪽 칸에 입력:
   ```
   https://realxbest.onrender.com
   ```

4. 저장하세요!

**✅ 완료!** 2번째 끝!

---

### 3번째: NODE_ENV 추가하기

**이게 뭐예요?**
- "지금은 실제 서비스 중이에요!"라고 알려주는 거예요

**어떻게 하나요?**

1. 다시 **"+ Add"** 버튼을 클릭하세요

2. 왼쪽 칸에 입력:
   ```
   NODE_ENV
   ```

3. 오른쪽 칸에 입력:
   ```
   production
   ```
   - "production"은 "실제 서비스 중"이라는 뜻이에요!

4. 저장하세요!

**✅ 완료!** 3번째 끝!

---

## 🎉 모두 완료!

이제 화면에 **4개**의 변수가 보여야 해요:

1. ✅ DATABASE_URL
2. ✅ YOUTUBE_API_KEY
3. ✅ NEXT_PUBLIC_BASE_URL
4. ✅ NODE_ENV

---

## 🚀 마지막 단계: 저장하고 배포하기

모든 변수를 추가했으면:

1. 화면 오른쪽 아래를 보세요
2. **"Save, rebuild, and deploy"** 버튼을 찾으세요
3. 클릭하세요!

**⏳ 잠깐만요!**
- 배포하는 데 5-10분 걸릴 수 있어요
- 조금만 기다려주세요!

---

## ✅ 끝!

배포가 끝나면:
- ✅ 웹사이트가 작동해요!
- ✅ https://realxbest.onrender.com 에서 확인할 수 있어요!

---

## 🆘 문제 해결

### "+ Add" 버튼이 안 보여요
- 화면을 아래로 내려보세요
- Environment Variables 섹션 아래에 있어요

### 값이 저장이 안 돼요
- KEY와 VALUE를 모두 입력했는지 확인하세요
- 다른 곳을 클릭하거나 Enter를 눌러보세요

### 실수로 잘못 입력했어요
- 각 변수 오른쪽에 휴지통 아이콘(🗑️)이 있어요
- 클릭하면 삭제할 수 있어요
- 다시 추가하면 돼요!

---

## 💡 팁

- **대소문자 주의**: KEY는 정확히 입력해야 해요!
- **공백 주의**: 앞뒤 공백이 없어야 해요
- **따옴표 없이**: VALUE는 따옴표 없이 입력하세요

---

## 📋 요약

**추가할 3개 변수:**

| KEY | VALUE |
|-----|-------|
| YOUTUBE_API_KEY | AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY |
| NEXT_PUBLIC_BASE_URL | https://realxbest.onrender.com |
| NODE_ENV | production |

**각 변수마다:**
1. "+ Add" 클릭
2. KEY 입력
3. VALUE 입력
4. 저장

**마지막:**
- "Save, rebuild, and deploy" 클릭

**끝!** 🎉

