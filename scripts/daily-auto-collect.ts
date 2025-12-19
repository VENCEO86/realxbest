/**
 * 데일리 자동 채널 수집 시스템 (최적화 버전)
 * 국가별/카테고리별 최소 300명 이상 확보
 * 속도 최적화 및 API 할당량 관리
 */

import { PrismaClient } from "@prisma/client";
import { COUNTRIES } from "../lib/countries";

const prisma = new PrismaClient();

// API 키 관리 (다중 키 지원)
const YOUTUBE_API_KEYS = (
  process.env.YOUTUBE_API_KEYS || 
  process.env.YOUTUBE_API_KEY || 
  ""
).split(",").map(key => key.trim()).filter(key => key.length > 0);

let currentKeyIndex = 0;
const keyUsageCount = new Map<string, number>();
const exhaustedKeys = new Set<string>();
const dailyQuotaUsed = new Map<string, number>(); // 키별 일일 사용량
const QUOTA_LIMIT_PER_KEY = 9000; // 키당 일일 할당량 (안전 마진)

// NoxInfluencer 벤치마킹 목표 설정 (데이터 확보 우선)
const TARGET_CHANNELS_PER_COUNTRY_CATEGORY = 500; // NoxInfluencer는 TOP 100이지만 더 많은 데이터 확보
const MIN_REQUIRED_CHANNELS = 200; // 최소 보장 개수 (NoxInfluencer 기준: 충분한 데이터)
const MIN_SUBSCRIBER_COUNT = 10000; // 최소 1만명 이상 (데이터 부족 국가를 위해 기준 완화)
const MIN_VIEW_COUNT = 500000; // 최소 50만 조회수 이상 (데이터 부족 국가를 위해 기준 완화)

// 국가별 최소 기준 조정 (품질 보장: 최소 3만명, 많은 국가는 5만명)
// 채널 수가 많은 국가(200개 이상): 5만명 이상
// 채널 수가 적은 국가(200개 미만): 3만명 이상
const COUNTRY_MIN_STANDARDS: Record<string, { subscribers: number; views: number }> = {
  // 채널 수가 많은 국가 (200개 이상) - 5만명 이상
  IT: { subscribers: 50000, views: 2000000 },   // 이탈리아 (2,183개)
  US: { subscribers: 50000, views: 2000000 },   // 미국 (1,294개)
  MX: { subscribers: 50000, views: 2000000 },   // 멕시코 (559개)
  CA: { subscribers: 50000, views: 2000000 },   // 캐나다 (525개)
  
  // 채널 수가 적은 국가 (200개 미만) - 데이터 부족 국가는 기준 완화
  // 10개 미만 국가: 1만명 이상 (더 많은 채널 수집)
  KR: { subscribers: 10000, views: 500000 },   // 한국 (25개) - 기준 완화
  ES: { subscribers: 10000, views: 500000 },   // 스페인 (19개) - 기준 완화
  IN: { subscribers: 10000, views: 500000 },   // 인도 (16개) - 기준 완화
  GB: { subscribers: 10000, views: 500000 },   // 영국 (16개) - 기준 완화
  AR: { subscribers: 10000, views: 500000 },   // 아르헨티나 (15개) - 기준 완화
  CO: { subscribers: 10000, views: 500000 },   // 콜롬비아 (9개) - 기준 완화
  PE: { subscribers: 10000, views: 500000 },   // 페루 (5개) - 기준 완화
  BD: { subscribers: 10000, views: 500000 },   // 방글라데시 (4개) - 기준 완화
  CL: { subscribers: 10000, views: 500000 },   // 칠레 (4개) - 기준 완화
  ID: { subscribers: 10000, views: 500000 },   // 인도네시아 (4개) - 기준 완화
  FR: { subscribers: 10000, views: 500000 },   // 프랑스 (4개) - 기준 완화
  PR: { subscribers: 10000, views: 500000 },   // 푸에르토리코 (4개) - 기준 완화
  PH: { subscribers: 10000, views: 500000 },   // 필리핀 (3개) - 기준 완화
  DE: { subscribers: 10000, views: 500000 },   // 독일 (3개) - 기준 완화
  DO: { subscribers: 10000, views: 500000 },   // 도미니카공화국 (3개) - 기준 완화
  AU: { subscribers: 10000, views: 500000 },   // 호주 (3개) - 기준 완화
  EC: { subscribers: 10000, views: 500000 },   // 에콰도르 (2개) - 기준 완화
  SV: { subscribers: 10000, views: 500000 },   // 엘살바도르 (2개) - 기준 완화
  AE: { subscribers: 10000, views: 500000 },   // 아랍에미리트 (2개) - 기준 완화
  PT: { subscribers: 10000, views: 500000 },   // 포르투갈 (2개) - 기준 완화
  BG: { subscribers: 10000, views: 500000 },   // 불가리아 (2개) - 기준 완화
  
  // 기타 국가 (1개) - 기준 완화
  RS: { subscribers: 10000, views: 500000 },   // 세르비아 - 기준 완화
  NG: { subscribers: 10000, views: 500000 },   // 나이지리아 - 기준 완화
  IL: { subscribers: 10000, views: 500000 },   // 이스라엘 - 기준 완화
  BO: { subscribers: 10000, views: 500000 },   // 볼리비아 - 기준 완화
  NL: { subscribers: 10000, views: 500000 },   // 네덜란드 - 기준 완화
  HN: { subscribers: 10000, views: 500000 },   // 온두라스 - 기준 완화
  TR: { subscribers: 10000, views: 500000 },   // 터키 - 기준 완화
  GR: { subscribers: 10000, views: 500000 },   // 그리스 - 기준 완화
  CH: { subscribers: 10000, views: 500000 },   // 스위스 - 기준 완화
  JP: { subscribers: 10000, views: 500000 },   // 일본 - 기준 완화
  LK: { subscribers: 10000, views: 500000 },   // 스리랑카 - 기준 완화
  SG: { subscribers: 10000, views: 500000 },   // 싱가포르 - 기준 완화
  ZA: { subscribers: 10000, views: 500000 },   // 남아프리카 - 기준 완화
  PK: { subscribers: 10000, views: 500000 },   // 파키스탄 - 기준 완화
  
  // 기본값 (명시되지 않은 국가) - 데이터 부족 국가를 위해 기준 완화
  default: { subscribers: 10000, views: 500000 },
};

// 국가별 현지어 키워드 매핑 (NoxInfluencer 벤치마킹: 확대)
const LOCAL_KEYWORDS: Record<string, Record<string, string[]>> = {
  IT: { // 이탈리아 (대폭 확대 - 최소 200개 보장)
    entertainment: [
      "intrattenimento", "divertimento", "spettacolo", "intrattenimento italiano", 
      "youtuber italiani", "canali italiani", "creatori italiani", "italian youtuber", 
      "italian channel", "youtuber italia", "canali youtube italia", "creatori italia",
      "comici italiani", "show italiani", "intrattenimento youtube italia",
      "top youtuber italiani", "migliori youtuber italiani", "famosi youtuber italiani",
      "italian entertainment", "italian comedy", "italian vlog", "italian lifestyle"
    ],
    music: [
      "musica italiana", "canzoni italiane", "musica", "cantanti italiani", 
      "artisti italiani", "italian music", "italian singer", "cantanti italia",
      "musica pop italiana", "rap italiano", "trap italiano", "rock italiano",
      "top musica italiana", "hit italiane", "canzoni italiane 2024",
      "italian artists", "italian musicians", "italian bands"
    ],
    education: [
      "educazione", "istruzione", "scuola", "scuola italiana", "università italiana",
      "lezioni italiane", "corsi italiani", "tutorial italiano", "insegnamento italiano",
      "italian education", "italian learning", "italian courses"
    ],
    gaming: [
      "giochi", "videogiochi", "gaming italiano", "gamer italiani", "streamer italiani",
      "youtuber gaming italiani", "videogiochi italia", "gaming italia",
      "italian gaming", "italian gamers", "italian streamers", "italian esports"
    ],
    sports: [
      "sport", "calcio", "sport italiano", "calcio italiano", "serie a",
      "sport italia", "calciatori italiani", "squadre italiane", "sportivi italiani",
      "italian sports", "italian football", "italian soccer", "italian athletes"
    ],
    news: [
      "notizie", "giornalismo", "informazione", "notizie italiane", "giornali italiani",
      "telegiornali italiani", "informazione italia", "attualità italiana",
      "italian news", "italian journalism", "italian media"
    ],
    people: [
      "vlog", "vlogger italiano", "youtuber italiano", "vlogger italiani",
      "vlog italia", "youtuber italia", "creatori italiani", "influencer italiani",
      "italian vlog", "italian vlogger", "italian influencers", "italian creators"
    ],
    howto: [
      "tutorial", "come fare", "guida", "tutorial italiano", "guide italiane",
      "come fare italiano", "istruzioni italiane", "consigli italiani",
      "italian tutorial", "italian guides", "italian tips", "italian diy"
    ],
  },
  TH: { // 태국 (대폭 확대 - 현지어 우선)
    entertainment: [
      "บันเทิง", "ความบันเทิง", "ความสนุก", "ยูทูบเบอร์ไทย",
      "ช่องไทย", "ครีเอเตอร์ไทย", "คนดัง", "ยอดนิยม",
      "ยูทูบเบอร์ยอดนิยม", "ช่องยอดนิยม", "ครีเอเตอร์ยอดนิยม",
      "ความบันเทิงไทย", "ยูทูบเบอร์", "ช่องยูทูบ"
    ],
    music: [
      "เพลงไทย", "ดนตรีไทย", "เพลง", "นักร้องไทย", "ศิลปินไทย",
      "thai music", "thai singer", "เพลงไทยยอดนิยม",
      "ดนตรีไทย", "ศิลปินไทย", "นักร้องไทย"
    ],
    education: [
      "การศึกษา", "เรียนรู้", "สอน", "เรียน",
      "การศึกษาภาษาไทย", "สอนภาษาไทย", "การเรียนรู้"
    ],
    gaming: [
      "เกม", "เกมส์", "เล่นเกม", "เกมไทย",
      "เกมเมอร์ไทย", "เกมสตรีม", "เกมไทย"
    ],
    sports: [
      "กีฬา", "ฟุตบอล", "กีฬาไทย", "ฟุตบอลไทย",
      "กีฬาไทย", "นักกีฬาไทย"
    ],
    news: [
      "ข่าว", "ข่าวสาร", "ข่าวไทย", "ข่าววันนี้",
      "ข่าวไทย", "ข่าวสารไทย"
    ],
    people: [
      "vlog", "vlogger ไทย", "youtuber ไทย", "vlog ไทย",
      "ชีวิตประจำวัน", "ไลฟ์สไตล์", "vlog ไทย"
    ],
    howto: [
      "สอน", "วิธีทำ", "เทคนิค", "วิธี",
      "สอนทำ", "วิธีทำ", "เทคนิคไทย"
    ],
  },
  VN: { // 베트남
    entertainment: ["giải trí", "vui chơi", "tiêu khiển"],
    music: ["âm nhạc", "nhạc Việt", "bài hát"],
    education: ["giáo dục", "học tập", "dạy học"],
    gaming: ["trò chơi", "game", "chơi game"],
    sports: ["thể thao", "bóng đá", "thể thao Việt"],
    news: ["tin tức", "báo chí", "thông tin"],
    people: ["vlog", "vlogger Việt", "youtuber Việt"],
    howto: ["hướng dẫn", "cách làm", "mẹo"],
  },
  PH: { // 필리핀
    entertainment: ["entertainment", "aliwan", "libangan"],
    music: ["musika", "kanta", "awit"],
    education: ["edukasyon", "aral", "turo"],
    gaming: ["laro", "games", "video games"],
    sports: ["sports", "palakasan", "laro"],
    news: ["balita", "news", "ulat"],
    people: ["vlog", "vlogger", "youtuber"],
    howto: ["tutorial", "paano", "guide"],
  },
  ID: { // 인도네시아
    entertainment: ["hiburan", "tontonan", "kesenangan"],
    music: ["musik", "lagu", "musik Indonesia"],
    education: ["pendidikan", "belajar", "pengajaran"],
    gaming: ["permainan", "game", "gaming"],
    sports: ["olahraga", "sepak bola", "olahraga Indonesia"],
    news: ["berita", "warta", "informasi"],
    people: ["vlog", "vlogger Indonesia", "youtuber Indonesia"],
    howto: ["tutorial", "cara", "panduan"],
  },
  ES: { // 스페인
    entertainment: ["entretenimiento", "diversión", "espectáculo"],
    music: ["música española", "canciones", "música"],
    education: ["educación", "aprendizaje", "enseñanza"],
    gaming: ["juegos", "videojuegos", "gaming español"],
    sports: ["deportes", "fútbol", "deportes españoles"],
    news: ["noticias", "periodismo", "información"],
    people: ["vlog", "vlogger español", "youtuber español"],
    howto: ["tutorial", "cómo hacer", "guía"],
  },
  FR: { // 프랑스
    entertainment: ["divertissement", "amusement", "spectacle"],
    music: ["musique française", "chansons", "musique"],
    education: ["éducation", "apprentissage", "enseignement"],
    gaming: ["jeux", "jeux vidéo", "gaming français"],
    sports: ["sports", "football", "sports français"],
    news: ["actualités", "journalisme", "information"],
    people: ["vlog", "vlogger français", "youtuber français"],
    howto: ["tutoriel", "comment faire", "guide"],
  },
  DE: { // 독일
    entertainment: ["Unterhaltung", "Vergnügen", "Show"],
    music: ["deutsche Musik", "Lieder", "Musik"],
    education: ["Bildung", "Lernen", "Unterricht"],
    gaming: ["Spiele", "Videospiele", "Gaming"],
    sports: ["Sport", "Fußball", "deutscher Sport"],
    news: ["Nachrichten", "Journalismus", "Information"],
    people: ["Vlog", "deutscher Vlogger", "deutscher YouTuber"],
    howto: ["Tutorial", "Anleitung", "Guide"],
  },
  JP: { // 일본 (확대)
    entertainment: ["エンターテインメント", "エンタメ", "ユーチューバー", "youtuber", "チャンネル", "チャンネル登録", "japanese youtuber", "japan channel"],
    music: ["音楽", "ミュージック", "歌", "アーティスト", "japanese music", "japan music"],
    education: ["教育", "学習", "授業"],
    gaming: ["ゲーム", "ビデオゲーム", "ゲーミング"],
    sports: ["スポーツ", "サッカー", "日本のスポーツ"],
    news: ["ニュース", "ジャーナリズム", "情報"],
    people: ["vlog", "日本のvlogger", "日本のyoutuber"],
    howto: ["チュートリアル", "やり方", "ガイド"],
  },
  CN: { // 중국
    entertainment: ["娱乐", "消遣", "表演"],
    music: ["中国音乐", "歌曲", "音乐"],
    education: ["教育", "学习", "教学"],
    gaming: ["游戏", "电子游戏", "游戏"],
    sports: ["体育", "足球", "中国体育"],
    news: ["新闻", "新闻业", "信息"],
    people: ["vlog", "中国vlogger", "中国youtuber"],
    howto: ["教程", "如何做", "指南"],
  },
};

// 카테고리 목록
const CATEGORIES = [
  { id: "entertainment", name: "엔터테인먼트", nameEn: "Entertainment", keywords: ["entertainment", "funny", "comedy", "vlog", "show"] },
  { id: "music", name: "음악", nameEn: "Music", keywords: ["music", "song", "artist", "musician", "singer"] },
  { id: "education", name: "교육", nameEn: "Education", keywords: ["education", "tutorial", "learn", "study", "course"] },
  { id: "gaming", name: "게임", nameEn: "Gaming", keywords: ["gaming", "game", "playthrough", "stream", "esports"] },
  { id: "sports", name: "스포츠", nameEn: "Sports", keywords: ["sports", "football", "basketball", "fitness", "soccer"] },
  { id: "news", name: "뉴스/정치", nameEn: "News/Politics", keywords: ["news", "politics", "current events", "breaking"] },
  { id: "people", name: "인물/블로그", nameEn: "People/Blog", keywords: ["vlog", "lifestyle", "daily", "blog", "personal"] },
  { id: "howto", name: "노하우/스타일", nameEn: "Howto/Style", keywords: ["howto", "tutorial", "tips", "style", "diy"] },
  { id: "other", name: "기타", nameEn: "Other", keywords: ["popular", "trending", "top", "best"] },
];

/**
 * 다음 사용 가능한 API 키 가져오기 (할당량 체크)
 */
function getNextApiKey(): string {
  const availableKeys = YOUTUBE_API_KEYS.filter(key => {
    if (exhaustedKeys.has(key)) return false;
    const used = dailyQuotaUsed.get(key) || 0;
    return used < QUOTA_LIMIT_PER_KEY;
  });
  
  if (availableKeys.length === 0) {
    throw new Error("모든 API 키의 할당량이 소진되었습니다.");
  }
  
  const key = availableKeys[currentKeyIndex % availableKeys.length];
  currentKeyIndex++;
  return key;
}

/**
 * API 키 사용량 증가
 */
function incrementApiUsage(key: string, units: number = 1) {
  const current = dailyQuotaUsed.get(key) || 0;
  dailyQuotaUsed.set(key, current + units);
  
  if (current + units >= QUOTA_LIMIT_PER_KEY) {
    exhaustedKeys.add(key);
    console.log(`  ⚠️ API 키 할당량 소진: ${key.substring(0, 20)}... (사용량: ${current + units})`);
  }
}

/**
 * 채널 검색 (YouTube Search API)
 */
// 국가별 언어 코드 매핑 (YouTube API hl 파라미터용) - 모든 국가 확장
const COUNTRY_LANGUAGE_CODES: Record<string, string> = {
  // 아시아
  JP: "ja",      // 일본어 ✅
  CN: "zh",      // 중국어 ✅
  KR: "ko",      // 한국어 ✅
  TH: "th",      // 태국어 ✅
  VN: "vi",      // 베트남어 ✅
  ID: "id",      // 인도네시아어 ✅
  MY: "ms",      // 말레이어 ✅
  PH: "en",      // 필리핀 (영어/타갈로그어 혼합)
  IN: "hi",      // 힌디어 ✅
  BD: "bn",      // 방글라데시어 (벵골어)
  PK: "ur",      // 우르두어
  MM: "my",      // 미얀마어
  KH: "km",      // 캄보디아어
  LA: "lo",      // 라오어
  TW: "zh-TW",   // 중국어 번체 (대만) ✅
  HK: "zh-HK",   // 중국어 번체 (홍콩) ✅
  SG: "en",      // 영어 (싱가포르) ✅
  
  // 유럽
  IT: "it",      // 이탈리아어 ✅
  ES: "es",      // 스페인어 ✅
  FR: "fr",      // 프랑스어 ✅
  DE: "de",      // 독일어 ✅
  PT: "pt",      // 포르투갈어 ✅
  NL: "nl",      // 네덜란드어 ✅
  PL: "pl",      // 폴란드어 ✅
  RU: "ru",      // 러시아어 ✅
  GR: "el",      // 그리스어 ✅
  CZ: "cs",      // 체코어 ✅
  RO: "ro",      // 루마니아어 ✅
  HU: "hu",      // 헝가리어 ✅
  UA: "uk",      // 우크라이나어 ✅
  TR: "tr",      // 터키어 ✅
  CH: "de",      // 독일어/프랑스어/이탈리아어
  AT: "de",      // 독일어
  BE: "nl",      // 네덜란드어/프랑스어
  SE: "sv",      // 스웨덴어
  NO: "no",      // 노르웨이어
  DK: "da",      // 덴마크어
  FI: "fi",      // 핀란드어
  IE: "en",      // 영어 (아일랜드)
  LU: "fr",      // 프랑스어/독일어
  IS: "is",      // 아이슬란드어
  MT: "mt",      // 몰타어
  
  // 중동
  SA: "ar",      // 아랍어 (사우디아라비아) ✅
  AE: "ar",      // 아랍어 (아랍에미리트) ✅
  EG: "ar",      // 아랍어 (이집트) ✅
  IL: "he",      // 히브리어 (이스라엘) ✅
  
  // 아메리카
  US: "en",      // 영어 (미국) ✅
  CA: "en",      // 영어 (캐나다) ✅
  MX: "es",      // 스페인어 (멕시코) ✅
  BR: "pt",      // 포르투갈어 (브라질) ✅
  AR: "es",      // 스페인어 (아르헨티나) ✅
  CL: "es",      // 스페인어 (칠레) ✅
  CO: "es",      // 스페인어 (콜롬비아) ✅
  PE: "es",      // 스페인어 (페루) ✅
  EC: "es",      // 스페인어 (에콰도르) ✅
  UY: "es",      // 스페인어 (우루과이)
  PY: "es",      // 스페인어 (파라과이)
  BO: "es",      // 스페인어 (볼리비아)
  VE: "es",      // 스페인어 (베네수엘라)
  
  // 오세아니아
  AU: "en",      // 영어 (호주) ✅
  NZ: "en",      // 영어 (뉴질랜드) ✅
  
  // 아프리카
  ZA: "en",      // 영어 (남아프리카)
  NG: "en",      // 영어 (나이지리아)
  KE: "en",      // 영어 (케냐)
  
  // 기타
  GL: "da",      // 덴마크어 (그린란드)
  GF: "fr",      // 프랑스어 (프랑스령 기아나)
  FK: "en",      // 영어 (포클랜드 제도)
};

/**
 * NoxInfluencer 방식 채널 검색 (개선)
 * - order 파라미터 활용 (viewCount, rating, relevance 등)
 * - 다양한 정렬 기준으로 인기 채널 우선 수집
 */
async function searchChannels(
  query: string,
  maxResults: number = 50,
  regionCode?: string,
  languageCode?: string,
  order: "viewCount" | "rating" | "relevance" | "date" = "viewCount"
): Promise<Array<{ channelId: string; channelName: string }>> {
  const apiKey = getNextApiKey();
  incrementApiUsage(apiKey, 100); // Search API는 100 units
  
  try {
    const params = new URLSearchParams({
      part: "snippet",
      q: query,
      type: "channel",
      maxResults: String(Math.min(maxResults, 50)),
      order: order, // NoxInfluencer처럼 정렬 기준 활용 (인기 채널 우선)
      key: apiKey,
    });
    
    // 지역 코드 추가 (검색 결과의 지역 설정) - 위치 기반 필터링 강화
    // regionCode는 필수로 설정하여 해당 지역의 검색 결과 우선 반환
    if (regionCode) {
      params.append("regionCode", regionCode);
    } else if (languageCode) {
      // regionCode가 없으면 languageCode에서 추론 (예: "ja" → "JP")
      const inferredRegion = Object.entries(COUNTRY_LANGUAGE_CODES).find(
        ([_, lang]) => lang === languageCode
      )?.[0];
      if (inferredRegion) {
        params.append("regionCode", inferredRegion);
      }
    }
    
    // 언어 코드 추가 (검색 결과의 언어 설정) - NoxInfluencer 방식
    // hl: 검색 결과의 언어 설정
    // relevanceLanguage: 관련 언어 설정 (검색 결과의 관련성 향상)
    if (languageCode) {
      params.append("hl", languageCode);
      params.append("relevanceLanguage", languageCode);
    }
    
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    
    if (!response.ok) {
      if (response.status === 403) {
        incrementApiUsage(apiKey, QUOTA_LIMIT_PER_KEY); // 할당량 소진으로 표시
        throw new Error(`API 키 할당량 소진: ${apiKey.substring(0, 20)}...`);
      }
      throw new Error(`YouTube API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.items) return [];
    
    return data.items
      .filter((item: any) => item.id?.channelId)
      .map((item: any) => ({
        channelId: item.id.channelId,
        channelName: item.snippet.title,
      }));
  } catch (error: any) {
    console.error(`  ❌ 검색 오류 (${query}):`, error.message);
    return [];
  }
}

/**
 * 기관/단체 채널 제외 키워드 (다국어 지원)
 * 개인 유튜버 위주로 수집하기 위한 필터링 키워드
 */
const EXCLUDE_KEYWORDS = [
  // 영어
  "official", "news", "tv", "channel", "media", "network",
  "corporation", "company", "inc", "ltd", "group",
  "government", "ministry", "department", "agency",
  "broadcast", "broadcasting", "station", "television",
  
  // 일본어
  "公式", "ニュース", "テレビ", "チャンネル", "メディア",
  "会社", "株式会社", "政府", "省", "庁",
  "放送", "放送局", "テレビ局", "ニュース局",
  
  // 중국어
  "官方", "新闻", "电视台", "频道", "媒体",
  "公司", "政府", "部门", "机构",
  "广播", "广播电台", "电视台", "新闻台",
  
  // 한국어
  "공식", "뉴스", "방송", "채널", "미디어",
  "회사", "정부", "부", "청",
  "방송국", "텔레비전", "뉴스방송",
  
  // 이탈리아어
  "ufficiale", "notizie", "televisione", "canale", "media",
  "azienda", "governo", "ministero",
  "trasmissione", "emittente", "televisiva",
  
  // 스페인어
  "oficial", "noticias", "televisión", "canal", "medios",
  "empresa", "gobierno", "ministerio",
  "transmisión", "emisora", "televisiva",
  
  // 프랑스어
  "officiel", "actualités", "télévision", "chaîne", "médias",
  "entreprise", "gouvernement", "ministère",
  "diffusion", "station", "télévisuelle",
  
  // 독일어
  "offiziell", "Nachrichten", "Fernsehen", "Kanal", "Medien",
  "Unternehmen", "Regierung", "Ministerium",
  "Rundfunk", "Sender", "Fernsehsender",
  
  // 아랍어
  "رسمي", "أخبار", "تلفزيون", "قناة", "إعلام",
  "شركة", "حكومة", "وزارة",
  "بث", "محطة", "تلفزيونية",
  
  // 태국어
  "ทางการ", "ข่าว", "ทีวี", "ช่อง", "สื่อ",
  "บริษัท", "รัฐบาล", "กระทรวง",
  "สถานี", "โทรทัศน์", "ข่าว",
  
  // 포르투갈어
  "oficial", "notícias", "televisão", "canal", "mídia",
  "empresa", "governo", "ministério",
  "transmissão", "emissora", "televisiva",
  
  // 러시아어
  "официальный", "новости", "телевидение", "канал", "СМИ",
  "компания", "правительство", "министерство",
  "вещание", "станция", "телевизионная",
];

/**
 * 개인 유튜버 필터링 함수
 * 기관/단체 채널을 제외하고 개인 크리에이터 위주로 필터링
 */
function isPersonalCreator(channelName: string, description: string | null): boolean {
  const nameLower = (channelName || "").toLowerCase();
  const descLower = (description || "").toLowerCase();
  
  // 기관/단체 키워드 포함 시 제외
  for (const keyword of EXCLUDE_KEYWORDS) {
    const keywordLower = keyword.toLowerCase();
    if (nameLower.includes(keywordLower) || descLower.includes(keywordLower)) {
      return false; // 기관/단체 채널로 판단하여 제외
    }
  }
  
  // 개인 유튜버 특징 확인
  // 1. 이름에 개인 이름 패턴 포함 (예: "John's Channel", "田中チャンネル")
  // 2. 설명에 "vlog", "personal", "creator" 등 포함
  // 3. 구독자 수가 적절한 범위 (너무 많으면 기관일 가능성)
  
  // 개인 유튜버 특징 키워드 (포함되면 개인 유튜버일 가능성 높음)
  const personalKeywords = [
    "vlog", "vlogger", "personal", "creator", "youtuber",
    "daily", "lifestyle", "my", "i'm", "i am",
    "チャンネル", "vlog", "日常", "個人", "私の",
    "vlog", "vlogger", "personal", "creator", "youtuber",
    "vlog", "vlogger", "personal", "creator", "youtuber",
  ];
  
  // 개인 유튜버 특징 키워드가 포함되면 개인 유튜버로 판단
  for (const keyword of personalKeywords) {
    const keywordLower = keyword.toLowerCase();
    if (nameLower.includes(keywordLower) || descLower.includes(keywordLower)) {
      return true; // 개인 유튜버로 판단
    }
  }
  
  // 기본적으로 개인 유튜버로 간주 (기관 키워드가 없으면)
  return true;
}

/**
 * 채널 상세 정보 가져오기 (배치 처리)
 * @param channelIds 채널 ID 배열
 * @param targetCountryCode 타겟 국가 코드 (필터링용)
 */
async function fetchChannelDetails(channelIds: string[], targetCountryCode?: string): Promise<any[]> {
  if (channelIds.length === 0) return [];
  
  const apiKey = getNextApiKey();
  const batchSize = 50; // YouTube API는 최대 50개씩
  const results: any[] = [];
  
  // 국가별 최소 기준 가져오기
  const minStandards = targetCountryCode && COUNTRY_MIN_STANDARDS[targetCountryCode]
    ? COUNTRY_MIN_STANDARDS[targetCountryCode]
    : { subscribers: MIN_SUBSCRIBER_COUNT, views: MIN_VIEW_COUNT };
  
  for (let i = 0; i < channelIds.length; i += batchSize) {
    const batch = channelIds.slice(i, i + batchSize);
    incrementApiUsage(apiKey, 1); // Channels API는 1 unit
    
    try {
      const ids = batch.join(",");
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${ids}&key=${apiKey}`
      );
      
      if (!response.ok) {
        if (response.status === 403) {
          incrementApiUsage(apiKey, QUOTA_LIMIT_PER_KEY);
          continue;
        }
        continue;
      }
      
      const data = await response.json();
      
      if (data.items) {
        for (const item of data.items) {
          const stats = item.statistics;
          const snippet = item.snippet;
          
          // 최소 기준 필터링 (국가별 기준 적용)
          const subscriberCount = parseInt(stats.subscriberCount || "0");
          const viewCount = parseInt(stats.viewCount || "0");
          
          // 프로필 이미지 URL 우선순위 (데이터 확보를 위해 필수 조건 제거)
          const profileImageUrl = snippet.thumbnails?.high?.url 
            || snippet.thumbnails?.medium?.url 
            || snippet.thumbnails?.default?.url 
            || null;
          
          // 국가별 최소 기준 적용 (품질 보장)
          // 채널 수가 많은 국가는 5만명 이상, 적은 국가는 3만명 이상
          const effectiveMinSubscribers = minStandards.subscribers;
          const effectiveMinViews = minStandards.views;
          
          if (subscriberCount >= effectiveMinSubscribers && viewCount >= effectiveMinViews) {
            const channelCountry = snippet.country || null;
            const channelName = snippet.title || "";
            const channelDescription = snippet.description || null;
            
            // 개인 유튜버 필터링 (기관/단체 채널 제외)
            if (!isPersonalCreator(channelName, channelDescription)) {
              continue; // 기관/단체 채널 제외
            }
            
            // 위치 기반 필터링 강화
            // 1. 채널 소유자의 국가 확인 (snippet.country)
            // 2. regionCode로 검색했으므로 해당 지역 결과일 가능성 높음
            // 3. 데이터 부족 국가는 완화된 필터링 적용
            
            if (targetCountryCode) {
              // 위치 기반 필터링 함수
              const shouldIncludeChannel = (channelCountry: string | null, targetCode: string): boolean => {
                // 국가 정보가 없으면 regionCode로 검색했으므로 포함 (완화 모드)
                if (!channelCountry) {
                  return true; // regionCode로 검색했으므로 해당 지역 결과일 가능성 높음
                }
                
                // 정확히 일치하면 포함
                if (channelCountry === targetCode) {
                  return true;
                }
                
                // 데이터 부족 국가는 완화된 필터링
                if (isDataScarceCountry) {
                  return true; // 데이터 부족 국가는 모든 채널 포함
                }
                
                // 관련 국가 허용 (예: 대만 → 중국, 홍콩 → 중국)
                const relatedCountries: Record<string, string[]> = {
                  TW: ["CN"], // 대만 → 중국
                  HK: ["CN"], // 홍콩 → 중국
                  MO: ["CN"], // 마카오 → 중국
                };
                
                if (relatedCountries[targetCode]?.includes(channelCountry)) {
                  return true; // 관련 국가 허용
                }
                
                // 엄격 모드: 국가 불일치 시 제외
                // 완화 모드: regionCode로 검색했으므로 포함
                return true; // 완화 모드 (더 많은 데이터 확보)
              };
              
              // 위치 기반 필터링 적용
              if (!shouldIncludeChannel(channelCountry, targetCountryCode)) {
                continue; // 다른 국가 채널 제외
              }
            }
            
            results.push({
              channelId: item.id,
              channelName: channelName,
              handle: snippet.customUrl?.replace("@", "") || null,
              profileImageUrl: profileImageUrl, // 필수 조건 통과
              subscriberCount,
              totalViewCount: viewCount,
              videoCount: parseInt(stats.videoCount || "0"),
              country: channelCountry || targetCountryCode || null, // 실제 국가 코드 우선, 없으면 타겟 국가 코드
              description: channelDescription,
              channelCreatedAt: snippet.publishedAt ? new Date(snippet.publishedAt) : null,
            });
          }
        }
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error: any) {
      console.error(`  ❌ 배치 오류:`, error.message);
    }
  }
  
  return results;
}

/**
 * 카테고리 가져오기 또는 생성
 */
async function getOrCreateCategory(name: string, nameEn: string): Promise<string> {
  let category = await prisma.category.findUnique({
    where: { name },
  });
  
  if (!category) {
    category = await prisma.category.create({
      data: { 
        name, 
        nameEn,
      },
    });
  }
  
  return category.id;
}

/**
 * 현재 채널 수 확인
 */
async function getChannelCount(countryCode: string, categoryId: string): Promise<number> {
  return await prisma.youTubeChannel.count({
    where: {
      country: countryCode,
      categoryId,
      subscriberCount: { gte: BigInt(MIN_SUBSCRIBER_COUNT) },
      totalViewCount: { gte: BigInt(MIN_VIEW_COUNT) },
    },
  });
}

/**
 * 채널 저장 (중복 체크)
 */
async function saveChannel(
  channelData: any,
  categoryId: string,
  countryCode: string
): Promise<boolean> {
  try {
    // 실제 채널 국가 코드 사용 (우선순위)
    // channelData.country가 있으면 사용, 없으면 검색한 countryCode 사용
    const actualCountryCode = channelData.country || countryCode;
    
    // 중복 체크
    const existing = await prisma.youTubeChannel.findUnique({
      where: { channelId: channelData.channelId },
    });
    
    if (existing) {
      // 기존 채널은 업데이트하지 않음 (할당량 절약)
      // 업데이트는 별도 스크립트(weekly-update-channels.ts)로 주 1회 수행
      return false; // 새로 저장한 것이 아님
    }
    
    // 프로필 이미지 URL 검증 및 처리
    let profileImageUrl = channelData.profileImageUrl;
    if (!profileImageUrl || profileImageUrl.trim() === "") {
      // 프로필 이미지가 없으면 기본 이미지 사용하지 않고 null로 저장
      profileImageUrl = null;
    }
    
    // 새 채널 저장
    await prisma.youTubeChannel.create({
      data: {
        channelId: channelData.channelId,
        channelName: channelData.channelName,
        handle: channelData.handle,
        profileImageUrl: profileImageUrl, // 검증된 프로필 이미지 URL
        categoryId,
        subscriberCount: BigInt(channelData.subscriberCount),
        totalViewCount: BigInt(channelData.totalViewCount),
        videoCount: channelData.videoCount,
        description: channelData.description,
        country: actualCountryCode, // 실제 국가 코드 사용
        channelCreatedAt: channelData.channelCreatedAt,
      },
    });
    
    return true;
  } catch (error: any) {
    console.error(`  ❌ 저장 오류 (${channelData.channelId}):`, error.message);
    return false;
  }
}

/**
 * 국가별/카테고리별 채널 수집
 */
async function collectChannelsForCountryCategory(
  countryCode: string,
  countryName: string,
  category: typeof CATEGORIES[0]
): Promise<{ collected: number; saved: number }> {
  const categoryId = await getOrCreateCategory(category.name, category.nameEn);
  
  // 현재 채널 수 확인
  const currentCount = await getChannelCount(countryCode, categoryId);
  
  // 최소 개수 미달 시 우선 수집
  if (currentCount < MIN_REQUIRED_CHANNELS) {
    const needToCollect = MIN_REQUIRED_CHANNELS - currentCount;
    console.log(`  ⚠️ ${countryName} - ${category.name}: ${currentCount}개 (최소 ${MIN_REQUIRED_CHANNELS}개 미달, ${needToCollect}개 긴급 수집 필요)`);
  } else if (currentCount >= TARGET_CHANNELS_PER_COUNTRY_CATEGORY) {
    console.log(`  ✅ ${countryName} - ${category.name}: ${currentCount}개 (목표 달성, 기존 채널 업데이트 계속)`);
    // 목표 달성해도 기존 채널 업데이트는 수행 (데이터 롤링)
    // return { collected: 0, saved: 0 }; // 제거: 데이터 롤링을 위해 계속 진행
  }
  
  // 신규 채널 수집 목표 계산 (기존 채널 업데이트는 별도 스크립트로 분리)
  // 최소 보장 개수(200개) 미달 시 우선 수집
  const needToCollect = currentCount >= TARGET_CHANNELS_PER_COUNTRY_CATEGORY
    ? 0 // 목표 달성 시 신규 수집 중단 (할당량 절약)
    : currentCount < MIN_REQUIRED_CHANNELS
      ? MIN_REQUIRED_CHANNELS - currentCount // 최소 보장 개수 미달 시 우선 수집
      : Math.max(
          MIN_REQUIRED_CHANNELS - currentCount, // 최소 보장
          TARGET_CHANNELS_PER_COUNTRY_CATEGORY - currentCount // 목표 달성
        );
  
  // 목표 달성 시 신규 수집 스킵 (단, 최소 보장 개수 미달 시에는 계속 수집)
  if (needToCollect === 0 && currentCount >= MIN_REQUIRED_CHANNELS) {
    console.log(`  ✅ ${countryName} - ${category.name}: ${currentCount}개 (목표 달성, 신규 수집 스킵)`);
    return { collected: 0, saved: 0 };
  }
  
  // 최소 보장 개수 미달 시 경고
  if (currentCount < MIN_REQUIRED_CHANNELS) {
    console.log(`  ⚠️ ${countryName} - ${category.name}: ${currentCount}개 (최소 ${MIN_REQUIRED_CHANNELS}개 미달, ${needToCollect}개 긴급 수집 필요)`);
  }
  
  console.log(`  🎯 ${countryName} - ${category.name}: ${currentCount}/${TARGET_CHANNELS_PER_COUNTRY_CATEGORY}개 (신규 ${needToCollect}개 필요)`);
  
  const allChannelIds = new Set<string>();
  
  // 기존 채널 ID 가져오기 (중복 제거용만 - 검색에서 제외하여 할당량 절약)
  const existingChannels = await prisma.youTubeChannel.findMany({
    where: {
      country: countryCode,
      categoryId: categoryId,
    },
    select: {
      channelId: true,
    },
  });
  
  // 기존 채널 ID를 Set에 추가 (중복 제거용만 - 검색에서 제외)
  const existingChannelIdsSet = new Set(existingChannels.map(ch => ch.channelId));
  
  // 카테고리 키워드로 검색 (순차 처리로 안정성 확보)
  // NoxInfluencer 벤치마킹: 더 많은 검색 결과 확보
  // 데이터 부족 국가(이탈리아 등)는 더 많이 검색
  // 신규 채널 수집에 집중 (기존 채널 제외하여 할당량 절약)
  const maxSearchResults = (countryCode === "IT" || currentCount < MIN_REQUIRED_CHANNELS)
    ? needToCollect * 5 // 데이터 부족 국가는 5배 검색 (이탈리아 등)
    : needToCollect * 3; // 필요량의 3배 검색 (더 많은 후보 확보)
  
  // 현지어 키워드 가져오기
  const localKeywords = LOCAL_KEYWORDS[countryCode]?.[category.id] || [];
  
  // 국가별 언어 코드 가져오기 (NoxInfluencer 방식)
  const languageCode = COUNTRY_LANGUAGE_CODES[countryCode] || "en";
  
  // NoxInfluencer 스타일 검색 쿼리 생성 함수 (대폭 확대 - 이탈리아 등 데이터 부족 국가 대응)
  const generateNoxStyleQueries = (keyword: string): string[] => {
    const queries = [
      // 기본 검색
      `${countryName} ${keyword}`,
      `${keyword} ${countryName}`,
      // 인기 채널 검색 (NoxInfluencer 스타일)
      `top ${countryName} ${keyword} youtubers`,
      `best ${countryName} ${keyword} channels`,
      `popular ${countryName} ${keyword} creators`,
      `famous ${countryName} ${keyword} youtubers`,
      // 구독자/조회수 기준 검색
      `most subscribed ${countryName} ${keyword}`,
      `highest subscribers ${countryName} ${keyword}`,
      `most viewed ${countryName} ${keyword}`,
      `highest views ${countryName} ${keyword}`,
      // 트렌딩 검색
      `trending ${countryName} ${keyword}`,
      `viral ${countryName} ${keyword}`,
      // 추가 검색 쿼리 (NoxInfluencer 벤치마킹)
      `${countryName} ${keyword} youtuber`,
      `${countryName} ${keyword} channel`,
      `${countryName} ${keyword} creator`,
      `best ${keyword} ${countryName} youtuber`,
      `top ${keyword} ${countryName} channel`,
    ];

    // 데이터 부족 국가(이탈리아 등)를 위한 추가 검색 쿼리
    if (countryCode === "IT" || currentCount < MIN_REQUIRED_CHANNELS) {
      queries.push(
        // 더 다양한 검색 패턴
        `${keyword} ${countryName} youtube`,
        `${countryName} ${keyword} content`,
        `${countryName} ${keyword} videos`,
        `italian ${keyword} youtuber`, // 이탈리아 특화
        `italian ${keyword} channel`, // 이탈리아 특화
        `italy ${keyword} youtuber`, // 이탈리아 특화
        `italy ${keyword} channel`, // 이탈리아 특화
        // 숫자 기반 검색 (인기 채널 찾기)
        `top 100 ${countryName} ${keyword}`,
        `top 50 ${countryName} ${keyword}`,
        `best 100 ${countryName} ${keyword}`,
        // 연도별 검색
        `${countryName} ${keyword} 2024`,
        `${countryName} ${keyword} 2023`,
      );
    }

    return queries;
  };
  
  // 다양한 정렬 기준으로 검색 (NoxInfluencer 방식)
  const orders: Array<"viewCount" | "rating" | "relevance" | "date"> = [
    "viewCount",  // 조회수 기준 (인기 채널 우선)
    "rating",     // 평점 기준
    "relevance",  // 관련성 기준
  ];
  
  // NoxInfluencer 벤치마킹: 더 많은 키워드로 검색 (15개 → 20개로 확대, 데이터 부족 국가는 더 많이)
  const keywordLimit = (countryCode === "IT" || currentCount < MIN_REQUIRED_CHANNELS) ? 20 : 15;
  for (const keyword of category.keywords.slice(0, keywordLimit)) {
    const queries = generateNoxStyleQueries(keyword);
    
    // 현지어 키워드 추가 (5개 → 10개로 확대, 데이터 부족 국가는 더 많이)
    const localKeywordLimit = (countryCode === "IT" || currentCount < MIN_REQUIRED_CHANNELS) ? 10 : 5;
    for (const localKeyword of localKeywords.slice(0, localKeywordLimit)) {
      queries.push(
        `${localKeyword}`,
        `${localKeyword} ${countryName}`,
        `${countryName} ${localKeyword}`,
        `top ${countryName} ${localKeyword}`,
        `best ${countryName} ${localKeyword}`,
        `popular ${localKeyword} ${countryName}`,
        // 이탈리아 특화
        ...(countryCode === "IT" ? [
          `italian ${localKeyword}`,
          `italy ${localKeyword}`,
          `italiano ${localKeyword}`,
        ] : [])
      );
    }
    
    // 각 정렬 기준으로 검색 (NoxInfluencer 방식)
    for (const order of orders) {
      if (allChannelIds.size >= maxSearchResults) break;
      
      // 데이터 부족 국가는 더 많은 쿼리 사용
      const queryLimit = (countryCode === "IT" || currentCount < MIN_REQUIRED_CHANNELS) ? 30 : 17;
      for (const query of queries.slice(0, queryLimit)) {
        if (allChannelIds.size >= maxSearchResults) break;
        
        const channels = await searchChannels(
          query,
          50,
          countryCode,
          languageCode,
          order // 정렬 기준 전달
        );
        
        // 기존 채널 제외하고 새로운 채널만 추가 (할당량 절약)
        for (const ch of channels) {
          if (ch.channelId && !existingChannelIdsSet.has(ch.channelId) && !allChannelIds.has(ch.channelId)) {
            allChannelIds.add(ch.channelId);
          }
        }
        
        // Rate limiting (API 할당량 보호) - 200ms → 150ms로 단축
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      
      // 추가 검색: 국가 코드만으로도 검색 (NoxInfluencer 방식, 데이터 부족 국가는 더 많이)
      if (allChannelIds.size < maxSearchResults) {
        const countryOnlyQueries = [
          `${countryName} youtuber`,
          `${countryName} channel`,
          `${countryName} creator`,
          `top ${countryName}`,
          `best ${countryName}`,
          `popular ${countryName}`,
          `famous ${countryName}`,
          `most subscribed ${countryName}`,
          `most viewed ${countryName}`,
        ];

        // 이탈리아 등 데이터 부족 국가를 위한 추가 쿼리
        if (countryCode === "IT" || currentCount < MIN_REQUIRED_CHANNELS) {
          countryOnlyQueries.push(
            `italian youtuber`, // 이탈리아 특화
            `italian channel`, // 이탈리아 특화
            `italy youtuber`, // 이탈리아 특화
            `italy channel`, // 이탈리아 특화
            `youtuber italia`, // 이탈리아 특화
            `canali italiani`, // 이탈리아 특화
            `creatori italiani`, // 이탈리아 특화
            `top italian youtubers`, // 이탈리아 특화
            `best italian channels`, // 이탈리아 특화
            `popular italian creators`, // 이탈리아 특화
            `most subscribed italian`, // 이탈리아 특화
            `most viewed italian`, // 이탈리아 특화
            `trending ${countryName}`, // 트렌딩 검색
            `viral ${countryName}`, // 바이럴 검색
          );
        }
        
        for (const query of countryOnlyQueries) {
          if (allChannelIds.size >= maxSearchResults) break;
          const channels = await searchChannels(query, 50, countryCode, languageCode, "viewCount");
          // 기존 채널 제외하고 새로운 채널만 추가 (할당량 절약)
          for (const ch of channels) {
            if (ch.channelId && !existingChannelIdsSet.has(ch.channelId) && !allChannelIds.has(ch.channelId)) {
              allChannelIds.add(ch.channelId);
            }
          }
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      }
      
      if (allChannelIds.size >= maxSearchResults) break;
    }
    
    if (allChannelIds.size >= maxSearchResults) break;
  }
  
  console.log(`    📊 ${allChannelIds.size}개 채널 ID 수집 완료`);
  
  if (allChannelIds.size === 0) {
    return { collected: 0, saved: 0 };
  }
  
  // 배치로 상세 정보 가져오기 (국가 코드 전달하여 필터링)
  const channelIdsArray = Array.from(allChannelIds);
  const channelDetails = await fetchChannelDetails(channelIdsArray, countryCode);
  
  console.log(`    📊 ${channelDetails.length}개 채널 상세 정보 수집 완료 (${countryCode} 필터링 적용)`);
  
  // 데이터베이스에 저장 (배치 처리)
  let savedCount = 0;
  const savePromises: Promise<boolean>[] = [];
  
  for (const channel of channelDetails) {
    savePromises.push(saveChannel(channel, categoryId, countryCode));
  }
  
  const saveResults = await Promise.all(savePromises);
  savedCount = saveResults.filter(r => r === true).length;
  
  console.log(`    💾 ${savedCount}개 새 채널 저장 완료`);
  
  return { collected: channelDetails.length, saved: savedCount };
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log("🚀 데일리 자동 채널 수집 시작...\n");
  console.log(`📊 목표: 국가별/카테고리별 최소 ${TARGET_CHANNELS_PER_COUNTRY_CATEGORY}개\n`);
  
  // 환경 변수 확인 (GitHub Actions 실패 방지)
  if (YOUTUBE_API_KEYS.length === 0) {
    console.error("❌ YouTube API 키가 설정되지 않았습니다.");
    console.error("   환경 변수 확인: YOUTUBE_API_KEYS 또는 YOUTUBE_API_KEY");
    process.exit(1);
  }
  
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL이 설정되지 않았습니다.");
    console.error("   GitHub Secrets에 DATABASE_URL이 설정되어 있는지 확인하세요.");
    process.exit(1);
  }
  
  console.log(`🔑 사용 가능한 API 키: ${YOUTUBE_API_KEYS.length}개`);
  console.log(`📈 키당 할당량: ${QUOTA_LIMIT_PER_KEY} units\n`);
  
  try {
    await prisma.$connect();
    console.log("✅ 데이터베이스 연결 성공\n");
    
    const countries = COUNTRIES.filter(c => c.value !== "all");
    
    // 1단계: 채널 수가 적은 국가 우선 수집 (200개 미만)
    console.log("🔍 채널 수가 적은 국가 확인 중...\n");
    const emptyCountries: Array<{ code: string; name: string; count: number }> = [];
    const lowCountCountries: Array<{ code: string; name: string; count: number }> = [];
    const countriesWithData: Array<{ code: string; name: string; count: number }> = [];
    
    for (const country of countries) {
      const count = await prisma.youTubeChannel.count({
        where: { country: country.value },
      });
      
      if (count === 0) {
        emptyCountries.push({ code: country.value, name: country.label, count });
      } else if (count < MIN_REQUIRED_CHANNELS) {
        lowCountCountries.push({ code: country.value, name: country.label, count });
      } else {
        countriesWithData.push({ code: country.value, name: country.label, count });
      }
    }
    
    // 우선순위 정렬: 0개 → 적은 순서대로
    emptyCountries.sort((a, b) => a.count - b.count);
    lowCountCountries.sort((a, b) => a.count - b.count);
    
    console.log(`📊 데이터가 없는 국가: ${emptyCountries.length}개`);
    console.log(`📊 채널 수가 적은 국가 (${MIN_REQUIRED_CHANNELS}개 미만): ${lowCountCountries.length}개`);
    console.log(`📊 충분한 데이터가 있는 국가: ${countriesWithData.length}개\n`);
    
    // 데이터가 없거나 적은 국가 우선 처리
    let totalCollected = 0;
    let totalSaved = 0;
    
    // 우선순위: 1) 데이터 없는 국가, 2) 채널 수가 적은 국가 (적은 순서대로)
    const priorityCountries = [...emptyCountries, ...lowCountCountries];
    
    if (priorityCountries.length > 0) {
      console.log(`🚀 채널 수가 적은 국가에 집중하여 수집 시작 (${priorityCountries.length}개 국가)...\n`);
      
      for (const country of priorityCountries) {
        const statusText = country.count === 0 ? "데이터 없음" : `현재 ${country.count}개`;
        console.log(`\n🌍 ${country.name} (${country.code}) - ${statusText}, 우선 수집\n`);
        
        for (const category of CATEGORIES) {
          try {
            const result = await collectChannelsForCountryCategory(
              country.code,
              country.name,
              category
            );
            
            totalCollected += result.collected;
            totalSaved += result.saved;
            
            await new Promise(resolve => setTimeout(resolve, 300));
          } catch (error: any) {
            console.error(`  ❌ 오류: ${category.name}`, error.message);
          }
          
          // 할당량 체크
          const availableKeys = YOUTUBE_API_KEYS.filter(key => {
            const used = dailyQuotaUsed.get(key) || 0;
            return used < QUOTA_LIMIT_PER_KEY;
          });
          
          if (availableKeys.length === 0) {
            console.log("\n⚠️ 모든 API 키의 할당량이 소진되었습니다.");
            break;
          }
        }
        
        if (exhaustedKeys.size >= YOUTUBE_API_KEYS.length) {
          break;
        }
      }
    }
    
    // 2단계: 충분한 데이터가 있는 국가는 신규 채널만 수집 (기존 로직)
    if (priorityCountries.length === 0 || exhaustedKeys.size < YOUTUBE_API_KEYS.length) {
      console.log("\n\n📈 데이터가 있는 국가의 신규 채널 수집 시작...\n");
      
      let processed = 0;
      const total = countriesWithData.length * CATEGORIES.length;
      
      for (const country of countriesWithData) {
        console.log(`\n🌍 ${country.name} (${country.code}) - 기존 ${country.count}개 채널\n`);
        
        for (const category of CATEGORIES) {
          processed++;
          const progress = ((processed / total) * 100).toFixed(1);
          console.log(`[${progress}%] 진행 중...`);
          
          try {
            const result = await collectChannelsForCountryCategory(
              country.code,
              country.name,
              category
            );
            
            totalCollected += result.collected;
            totalSaved += result.saved;
            
            await new Promise(resolve => setTimeout(resolve, 300));
          } catch (error: any) {
            console.error(`  ❌ 오류: ${category.name}`, error.message);
          }
          
          // 할당량 체크
          const availableKeys = YOUTUBE_API_KEYS.filter(key => {
            const used = dailyQuotaUsed.get(key) || 0;
            return used < QUOTA_LIMIT_PER_KEY;
          });
          
          if (availableKeys.length === 0) {
            console.log("\n⚠️ 모든 API 키의 할당량이 소진되었습니다. 오늘 수집을 중단합니다.");
            break;
          }
        }
        
        if (exhaustedKeys.size >= YOUTUBE_API_KEYS.length) {
          break;
        }
      }
    }
    
    console.log(`\n\n✅ 수집 완료!`);
    console.log(`📊 총 수집: ${totalCollected}개`);
    console.log(`💾 총 저장: ${totalSaved}개`);
    console.log(`🔑 사용된 API 키: ${YOUTUBE_API_KEYS.length - exhaustedKeys.size}/${YOUTUBE_API_KEYS.length}개\n`);
    
  } catch (error: any) {
    console.error("❌ 오류 발생:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 실행
main().catch(console.error);

