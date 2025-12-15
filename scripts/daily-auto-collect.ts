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
const MIN_SUBSCRIBER_COUNT = 100; // 데이터 확보를 위해 완화 (1000 → 100)
const MIN_VIEW_COUNT = 1000; // 데이터 확보를 위해 완화 (10000 → 1000)

// 국가별 최소 기준 조정 (NoxInfluencer 벤치마킹: 더 많은 데이터 확보)
const COUNTRY_MIN_STANDARDS: Record<string, { subscribers: number; views: number }> = {
  IT: { subscribers: 100, views: 1000 },   // 이탈리아 (기준 완화)
  TH: { subscribers: 100, views: 1000 },   // 태국 (기준 완화)
  JP: { subscribers: 100, views: 1000 },   // 일본 (기준 완화)
  BR: { subscribers: 100, views: 1000 },   // 브라질 (기준 완화)
  VN: { subscribers: 500, views: 5000 },   // 베트남
  PH: { subscribers: 500, views: 5000 },   // 필리핀
  ID: { subscribers: 500, views: 5000 },   // 인도네시아
  MY: { subscribers: 500, views: 5000 },   // 말레이시아
  SG: { subscribers: 500, views: 5000 },   // 싱가포르
  TW: { subscribers: 500, views: 5000 },   // 대만
  HK: { subscribers: 500, views: 5000 },   // 홍콩
  BD: { subscribers: 500, views: 5000 },   // 방글라데시
  PK: { subscribers: 500, views: 5000 },   // 파키스탄
  MM: { subscribers: 500, views: 5000 },   // 미얀마
  KH: { subscribers: 500, views: 5000 },   // 캄보디아
  LA: { subscribers: 500, views: 5000 },   // 라오스
  BN: { subscribers: 500, views: 5000 },   // 브루나이
  CL: { subscribers: 500, views: 5000 },   // 칠레
  AR: { subscribers: 500, views: 5000 },   // 아르헨티나
  UY: { subscribers: 500, views: 5000 },   // 우루과이
  CO: { subscribers: 500, views: 5000 },   // 콜롬비아
  PE: { subscribers: 500, views: 5000 },   // 페루
  EC: { subscribers: 500, views: 5000 },   // 에콰도르
  PY: { subscribers: 500, views: 5000 },   // 파라과이
  BO: { subscribers: 500, views: 5000 },   // 볼리비아
  VE: { subscribers: 500, views: 5000 },   // 베네수엘라
  GY: { subscribers: 500, views: 5000 },   // 가이아나
  SR: { subscribers: 500, views: 5000 },   // 수리남
  GF: { subscribers: 500, views: 5000 },   // 프랑스령 기아나
  FK: { subscribers: 500, views: 5000 },   // 포클랜드 제도
  NL: { subscribers: 500, views: 5000 },   // 네덜란드
  CH: { subscribers: 500, views: 5000 },   // 스위스
  SE: { subscribers: 500, views: 5000 },   // 스웨덴
  BE: { subscribers: 500, views: 5000 },   // 벨기에
  AT: { subscribers: 500, views: 5000 },   // 오스트리아
  IE: { subscribers: 500, views: 5000 },   // 아일랜드
  NO: { subscribers: 500, views: 5000 },   // 노르웨이
  DK: { subscribers: 500, views: 5000 },   // 덴마크
  FI: { subscribers: 500, views: 5000 },   // 핀란드
  LU: { subscribers: 500, views: 5000 },   // 룩셈부르크
  IS: { subscribers: 500, views: 5000 },   // 아이슬란드
  MC: { subscribers: 500, views: 5000 },   // 모나코
  LI: { subscribers: 500, views: 5000 },   // 리히텐슈타인
  MT: { subscribers: 500, views: 5000 },   // 몰타
  AD: { subscribers: 500, views: 5000 },   // 안도라
  ES: { subscribers: 500, views: 5000 },   // 스페인
  PL: { subscribers: 500, views: 5000 },   // 폴란드
  PT: { subscribers: 500, views: 5000 },   // 포르투갈
  GR: { subscribers: 500, views: 5000 },   // 그리스
  CZ: { subscribers: 500, views: 5000 },   // 체코
  RO: { subscribers: 500, views: 5000 },   // 루마니아
  HU: { subscribers: 500, views: 5000 },   // 헝가리
  UA: { subscribers: 500, views: 5000 },   // 우크라이나
  SA: { subscribers: 500, views: 5000 },   // 사우디아라비아
  AE: { subscribers: 500, views: 5000 },   // 아랍에미리트
  IL: { subscribers: 500, views: 5000 },   // 이스라엘
  TR: { subscribers: 500, views: 5000 },   // 터키
  EG: { subscribers: 500, views: 5000 },   // 이집트
  AU: { subscribers: 500, views: 5000 },   // 호주
  NZ: { subscribers: 500, views: 5000 },   // 뉴질랜드
  ZA: { subscribers: 500, views: 5000 },   // 남아프리카
  NG: { subscribers: 500, views: 5000 },   // 나이지리아
  KE: { subscribers: 500, views: 5000 },   // 케냐
};

// 국가별 현지어 키워드 매핑 (NoxInfluencer 벤치마킹: 확대)
const LOCAL_KEYWORDS: Record<string, Record<string, string[]>> = {
  IT: { // 이탈리아 (확대)
    entertainment: ["intrattenimento", "divertimento", "spettacolo", "intrattenimento italiano", "youtuber italiani", "canali italiani", "creatori italiani", "italian youtuber", "italian channel"],
    music: ["musica italiana", "canzoni italiane", "musica", "cantanti italiani", "artisti italiani", "italian music", "italian singer"],
    education: ["educazione", "istruzione", "scuola"],
    gaming: ["giochi", "videogiochi", "gaming italiano"],
    sports: ["sport", "calcio", "sport italiano"],
    news: ["notizie", "giornalismo", "informazione"],
    people: ["vlog", "vlogger italiano", "youtuber italiano"],
    howto: ["tutorial", "come fare", "guida"],
  },
  TH: { // 태국 (확대)
    entertainment: ["บันเทิง", "ความบันเทิง", "ความสนุก", "ยูทูบเบอร์ไทย", "ช่องไทย", "ครีเอเตอร์ไทย", "thai youtuber", "thai channel", "thai creator"],
    music: ["เพลงไทย", "ดนตรีไทย", "เพลง", "นักร้องไทย", "ศิลปินไทย", "thai music", "thai singer"],
    education: ["การศึกษา", "เรียนรู้", "สอน"],
    gaming: ["เกม", "เกมส์", "เล่นเกม"],
    sports: ["กีฬา", "ฟุตบอล", "กีฬาไทย"],
    news: ["ข่าว", "ข่าวสาร", "ข่าวไทย"],
    people: ["vlog", "vlogger ไทย", "youtuber ไทย"],
    howto: ["สอน", "วิธีทำ", "เทคนิค"],
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
// 국가별 언어 코드 매핑 (YouTube API hl 파라미터용)
const COUNTRY_LANGUAGE_CODES: Record<string, string> = {
  IT: "it", // 이탈리아어
  TH: "th", // 태국어
  VN: "vi", // 베트남어
  PH: "en", // 필리핀 (영어)
  ID: "id", // 인도네시아어
  ES: "es", // 스페인어
  FR: "fr", // 프랑스어
  DE: "de", // 독일어
  JP: "ja", // 일본어
  CN: "zh", // 중국어
  KR: "ko", // 한국어
  BR: "pt", // 포르투갈어 (브라질)
  PT: "pt", // 포르투갈어
  RU: "ru", // 러시아어
  TR: "tr", // 터키어
  PL: "pl", // 폴란드어
  NL: "nl", // 네덜란드어
  GR: "el", // 그리스어
  CZ: "cs", // 체코어
  RO: "ro", // 루마니아어
  HU: "hu", // 헝가리어
  UA: "uk", // 우크라이나어
  AR: "es", // 스페인어 (아르헨티나)
  CL: "es", // 스페인어 (칠레)
  CO: "es", // 스페인어 (콜롬비아)
  PE: "es", // 스페인어 (페루)
  EC: "es", // 스페인어 (에콰도르)
  MX: "es", // 스페인어 (멕시코)
  SA: "ar", // 아랍어 (사우디아라비아)
  AE: "ar", // 아랍어 (아랍에미리트)
  EG: "ar", // 아랍어 (이집트)
  IL: "he", // 히브리어 (이스라엘)
  IN: "hi", // 힌디어 (인도)
  MY: "ms", // 말레이어
  SG: "en", // 영어 (싱가포르)
  TW: "zh-TW", // 중국어 번체 (대만)
  HK: "zh-HK", // 중국어 번체 (홍콩)
  AU: "en", // 영어 (호주)
  NZ: "en", // 영어 (뉴질랜드)
  CA: "en", // 영어 (캐나다)
  GB: "en", // 영어 (영국)
  US: "en", // 영어 (미국)
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
    
    // 지역 코드 추가 (검색 결과의 지역 설정)
    if (regionCode) {
      params.append("regionCode", regionCode);
    }
    
    // 언어 코드 추가 (검색 결과의 언어 설정) - NoxInfluencer 방식
    if (languageCode) {
      params.append("hl", languageCode);
      // 추가 파라미터: relevanceLanguage (관련 언어 설정)
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
          
          // NoxInfluencer 벤치마킹: 최소 기준 완화하여 더 많은 데이터 확보
          if (subscriberCount >= minStandards.subscribers && viewCount >= minStandards.views) {
            const channelCountry = snippet.country || null;
            
            // NoxInfluencer 벤치마킹: 국가 필터링 완화 (더 많은 데이터 확보)
            // 타겟 국가 코드가 있으면 우선적으로 필터링하되, null인 경우는 포함
            if (targetCountryCode) {
              // 채널 국가가 명시적으로 다른 국가이면 제외
              // null인 경우는 YouTube API에서 국가 정보를 제공하지 않는 경우이므로 포함
              // 주석 처리: 데이터 부족 시 완화
              // if (channelCountry && channelCountry !== targetCountryCode) {
              //   continue; // 다른 국가 채널 제외
              // }
            }
            
            results.push({
              channelId: item.id,
              channelName: snippet.title,
              handle: snippet.customUrl?.replace("@", "") || null,
              profileImageUrl: profileImageUrl, // 필수 조건 통과
              subscriberCount,
              totalViewCount: viewCount,
              videoCount: parseInt(stats.videoCount || "0"),
              country: channelCountry || targetCountryCode || null, // 실제 국가 코드 우선, 없으면 타겟 국가 코드
              description: snippet.description || null,
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
      // 기존 채널 업데이트 (국가 코드도 업데이트)
      await prisma.youTubeChannel.update({
        where: { channelId: channelData.channelId },
        data: {
          channelName: channelData.channelName,
          subscriberCount: BigInt(channelData.subscriberCount),
          totalViewCount: BigInt(channelData.totalViewCount),
          videoCount: channelData.videoCount,
          profileImageUrl: channelData.profileImageUrl,
          handle: channelData.handle,
          description: channelData.description,
          country: actualCountryCode, // 실제 국가 코드로 업데이트
          lastUpdated: new Date(),
        },
      });
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
  
  // 목표 달성 여부와 관계없이 최소 200개는 확보하도록 수집
  const needToCollect = currentCount >= TARGET_CHANNELS_PER_COUNTRY_CATEGORY
    ? Math.max(200 - currentCount, 0) // 목표 달성 시에도 최소 200개 보장
    : Math.max(
        MIN_REQUIRED_CHANNELS - currentCount, // 최소 보장
        TARGET_CHANNELS_PER_COUNTRY_CATEGORY - currentCount // 목표 달성
      );
  
  console.log(`  🎯 ${countryName} - ${category.name}: ${currentCount}/${TARGET_CHANNELS_PER_COUNTRY_CATEGORY}개 (최소: ${MIN_REQUIRED_CHANNELS}개, ${needToCollect}개 필요)`);
  
  const allChannelIds = new Set<string>();
  
  // 기존 채널 ID도 가져와서 업데이트 대상으로 포함 (데이터 롤링)
  const existingChannels = await prisma.youTubeChannel.findMany({
    where: {
      country: countryCode,
      categoryId: categoryId,
    },
    select: {
      channelId: true,
    },
    take: 200, // 최대 200개 기존 채널 업데이트
  });
  
  existingChannels.forEach(ch => {
    if (ch.channelId) {
      allChannelIds.add(ch.channelId);
    }
  });
  
  // 카테고리 키워드로 검색 (순차 처리로 안정성 확보)
  // NoxInfluencer 벤치마킹: 더 많은 검색 결과 확보
  const maxSearchResults = currentCount >= TARGET_CHANNELS_PER_COUNTRY_CATEGORY
    ? Math.max(500 - existingChannels.length, 200) // 목표 달성 시에도 더 많이 검색
    : needToCollect * 3; // 필요량의 3배 검색 (더 많은 후보 확보)
  
  // 현지어 키워드 가져오기
  const localKeywords = LOCAL_KEYWORDS[countryCode]?.[category.id] || [];
  
  // 국가별 언어 코드 가져오기 (NoxInfluencer 방식)
  const languageCode = COUNTRY_LANGUAGE_CODES[countryCode] || "en";
  
  // NoxInfluencer 스타일 검색 쿼리 생성 함수
  const generateNoxStyleQueries = (keyword: string): string[] => {
    return [
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
    ];
  };
  
  // 다양한 정렬 기준으로 검색 (NoxInfluencer 방식)
  const orders: Array<"viewCount" | "rating" | "relevance" | "date"> = [
    "viewCount",  // 조회수 기준 (인기 채널 우선)
    "rating",     // 평점 기준
    "relevance",  // 관련성 기준
  ];
  
  // NoxInfluencer 벤치마킹: 더 많은 키워드로 검색 (10개 → 15개)
  for (const keyword of category.keywords.slice(0, 15)) {
    const queries = generateNoxStyleQueries(keyword);
    
    // 현지어 키워드 추가 (3개 → 5개 확대)
    for (const localKeyword of localKeywords.slice(0, 5)) {
      queries.push(
        `${localKeyword}`,
        `${localKeyword} ${countryName}`,
        `${countryName} ${localKeyword}`,
        `top ${countryName} ${localKeyword}`
      );
    }
    
    // 각 정렬 기준으로 검색 (NoxInfluencer 방식)
    for (const order of orders) {
      if (allChannelIds.size >= maxSearchResults) break;
      
      for (const query of queries.slice(0, 12)) { // 상위 12개 쿼리 사용
        if (allChannelIds.size >= maxSearchResults) break;
        
        const channels = await searchChannels(
          query,
          50,
          countryCode,
          languageCode,
          order // 정렬 기준 전달
        );
        
        for (const ch of channels) {
          if (ch.channelId) {
            allChannelIds.add(ch.channelId);
          }
        }
        
        // Rate limiting (API 할당량 보호)
        await new Promise(resolve => setTimeout(resolve, 200));
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
    let totalCollected = 0;
    let totalSaved = 0;
    let processed = 0;
    const total = countries.length * CATEGORIES.length;
    
    for (const country of countries) {
      console.log(`\n🌍 ${country.label} (${country.value}) 처리 중...\n`);
      
      for (const category of CATEGORIES) {
        processed++;
        const progress = ((processed / total) * 100).toFixed(1);
        console.log(`[${progress}%] 진행 중...`);
        
        try {
          const result = await collectChannelsForCountryCategory(
            country.value,
            country.label,
            category
          );
          
          totalCollected += result.collected;
          totalSaved += result.saved;
          
          // API 할당량 보호
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

