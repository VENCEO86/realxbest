# 이탈리아 채널 수집 개선 사항

## 📊 문제 상황
- 이탈리아로 필터링 시 **17개만 표시**되는 문제 발생
- 목표: **최소 200개 이상** 채널 확보

## ✅ 개선 사항

### 1. 이탈리아 현지어 키워드 대폭 확대
각 카테고리별 키워드를 **10개 이상**으로 확대:

#### Entertainment (엔터테인먼트)
- 기존: 9개
- 개선: **20개 이상**
- 추가 키워드: `comici italiani`, `show italiani`, `top youtuber italiani`, `migliori youtuber italiani`, `famosi youtuber italiani`, `italian entertainment`, `italian comedy`, `italian vlog`, `italian lifestyle` 등

#### Music (음악)
- 기존: 7개
- 개선: **15개 이상**
- 추가 키워드: `cantanti italia`, `musica pop italiana`, `rap italiano`, `trap italiano`, `rock italiano`, `top musica italiana`, `hit italiane`, `canzoni italiane 2024`, `italian artists`, `italian musicians`, `italian bands` 등

#### Education (교육)
- 기존: 3개
- 개선: **10개 이상**
- 추가 키워드: `scuola italiana`, `università italiana`, `lezioni italiane`, `corsi italiani`, `tutorial italiano`, `insegnamento italiano`, `italian education`, `italian learning`, `italian courses` 등

#### Gaming (게임)
- 기존: 3개
- 개선: **12개 이상**
- 추가 키워드: `gamer italiani`, `streamer italiani`, `youtuber gaming italiani`, `videogiochi italia`, `gaming italia`, `italian gaming`, `italian gamers`, `italian streamers`, `italian esports` 등

#### Sports (스포츠)
- 기존: 3개
- 개선: **12개 이상**
- 추가 키워드: `calcio italiano`, `serie a`, `sport italia`, `calciatori italiani`, `squadre italiane`, `sportivi italiani`, `italian sports`, `italian football`, `italian soccer`, `italian athletes` 등

#### News (뉴스)
- 기존: 3개
- 개선: **10개 이상**
- 추가 키워드: `notizie italiane`, `giornali italiani`, `telegiornali italiani`, `informazione italia`, `attualità italiana`, `italian news`, `italian journalism`, `italian media` 등

#### People (인물/블로그)
- 기존: 3개
- 개선: **12개 이상**
- 추가 키워드: `vlogger italiani`, `vlog italia`, `youtuber italia`, `creatori italiani`, `influencer italiani`, `italian vlog`, `italian vlogger`, `italian influencers`, `italian creators` 등

#### Howto (노하우/스타일)
- 기존: 3개
- 개선: **10개 이상**
- 추가 키워드: `tutorial italiano`, `guide italiane`, `come fare italiano`, `istruzioni italiane`, `consigli italiani`, `italian tutorial`, `italian guides`, `italian tips`, `italian diy` 등

### 2. 이탈리아 특화 검색 쿼리 추가
각 검색 쿼리에 이탈리아 특화 키워드 추가:
- `italian ${keyword} youtuber`
- `italian ${keyword} channel`
- `italy ${keyword} youtuber`
- `italy ${keyword} channel`
- `youtuber italia`
- `canali italiani`
- `creatori italiani`
- `top italian youtubers`
- `best italian channels`
- `popular italian creators`
- `most subscribed italian`
- `most viewed italian`

### 3. 검색량 대폭 증가
- **일반 국가**: 필요량의 3배 검색
- **데이터 부족 국가 (이탈리아)**: 필요량의 **5배 검색**
- 예: 200개 필요 시 → **1,000개 검색**

### 4. 최소 기준 완화 (이탈리아)
- **일반 국가**: 구독자 100명 이상, 조회수 1,000 이상
- **이탈리아**: 구독자 **50명 이상**, 조회수 **500 이상** (더 완화)

### 5. 검색 쿼리 다양화
- **일반 국가**: 각 키워드당 17개 쿼리
- **이탈리아**: 각 키워드당 **30개 쿼리**

### 6. 키워드 수 증가
- **일반 국가**: 카테고리당 15개 키워드
- **이탈리아**: 카테고리당 **20개 키워드**

### 7. 현지어 키워드 확대
- **일반 국가**: 현지어 키워드 5개
- **이탈리아**: 현지어 키워드 **10개**

## 📈 예상 효과

### 수집량 증가
- 기존: 17개
- 예상: **200개 이상** (약 12배 증가)

### 검색 범위 확대
- 기존 검색 쿼리: 약 200개
- 개선 후: 약 **1,500개 이상** (약 7.5배 증가)

### 데이터 품질
- 최소 기준 완화로 더 많은 채널 수집 가능
- 다양한 키워드로 다양한 채널 발견 가능

## 🔄 실행 방법

### 로컬 실행
```bash
# 환경 변수 설정 필요
export DATABASE_URL="your_database_url"
export YOUTUBE_API_KEYS="your_api_keys"

# 실행
npm run collect:daily
```

### GitHub Actions 실행
1. GitHub 저장소 → Actions 탭
2. "Daily Channel Collection" 워크플로우 선택
3. "Run workflow" 클릭

## 📝 변경된 파일
- `scripts/daily-auto-collect.ts`: 이탈리아 채널 수집 로직 대폭 개선

## ⚠️ 주의사항
- API 할당량 관리 필요 (키당 9,000 units)
- 수집 시간 증가 가능 (더 많은 검색 쿼리)
- 데이터베이스 저장 공간 확인 필요

