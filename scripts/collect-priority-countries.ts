/**
 * 우선순위 국가 채널 수집 스크립트
 * 한국, 일본, 중국, 독일, 영국, 프랑스, 브라질, 멕시코
 * 각 국가별 최소 200개 이상 확보 목표
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// API 키 관리
const YOUTUBE_API_KEYS = (
  process.env.YOUTUBE_API_KEYS || 
  process.env.YOUTUBE_API_KEY || 
  ""
).split(",").map(key => key.trim()).filter(key => key.length > 0);

let currentKeyIndex = 0;
const QUOTA_LIMIT_PER_KEY = 9000;

function getNextApiKey(): string {
  const key = YOUTUBE_API_KEYS[currentKeyIndex % YOUTUBE_API_KEYS.length];
  currentKeyIndex++;
  return key;
}

// 국가별 최소 기준 (완화)
const MIN_SUBSCRIBER_COUNT = 50;
const MIN_VIEW_COUNT = 500;

// 국가별 언어 코드 및 현지어 키워드
const COUNTRY_CONFIG: Record<string, {
  languageCode: string;
  regionCode: string;
  keywords: Record<string, string[]>;
}> = {
  KR: {
    languageCode: "ko",
    regionCode: "KR",
    keywords: {
      entertainment: [
        "엔터테인먼트", "예능", "오락", "유튜버", "크리에이터", "한국 유튜버",
        "korean youtuber", "korean channel", "korean creator", "korean entertainment",
        "한국 예능", "한국 오락", "한국 크리에이터", "인기 유튜버", "유명 유튜버",
        "top korean youtuber", "best korean channel", "popular korean creator"
      ],
      music: [
        "음악", "K-pop", "케이팝", "한국 음악", "가수", "아이돌", "한국 가수",
        "korean music", "k-pop", "korean singer", "korean artist", "korean idol",
        "한국 가요", "K-pop music", "korean pop", "korean band", "korean musician"
      ],
      gaming: [
        "게임", "게이밍", "게임 유튜버", "한국 게임", "게임 방송", "게임 스트리머",
        "korean gaming", "korean gamer", "korean streamer", "korean esports",
        "게임 크리에이터", "게임 플레이", "게임 리뷰", "korean game channel"
      ],
      sports: [
        "스포츠", "운동", "한국 스포츠", "축구", "야구", "농구", "한국 축구",
        "korean sports", "korean football", "korean soccer", "korean baseball",
        "korean athlete", "korean sports channel", "한국 운동", "한국 선수"
      ],
      education: [
        "교육", "학습", "강의", "한국 교육", "온라인 강의", "교육 채널",
        "korean education", "korean learning", "korean course", "korean tutorial",
        "한국 학습", "한국 강의", "교육 유튜버", "korean education channel"
      ],
      news: [
        "뉴스", "시사", "한국 뉴스", "뉴스 채널", "시사 프로그램", "한국 시사",
        "korean news", "korean journalism", "korean media", "korean current events",
        "한국 언론", "한국 미디어", "뉴스 유튜버", "korean news channel"
      ],
      people: [
        "브이로그", "일상", "라이프스타일", "한국 브이로그", "한국 일상", "한국 라이프",
        "korean vlog", "korean lifestyle", "korean daily", "korean vlogger",
        "한국 인플루언서", "한국 크리에이터", "korean influencer", "korean creator"
      ],
      howto: [
        "튜토리얼", "하우투", "팁", "노하우", "한국 튜토리얼", "한국 팁",
        "korean tutorial", "korean howto", "korean tips", "korean guide",
        "한국 노하우", "한국 가이드", "korean diy", "korean tips and tricks"
      ],
      other: [
        "한국 유튜버", "한국 채널", "한국 크리에이터", "인기 채널", "유명 채널",
        "korean youtuber", "korean channel", "korean creator", "top korean",
        "best korean", "popular korean", "famous korean", "korean content"
      ],
    },
  },
  JP: {
    languageCode: "ja",
    regionCode: "JP",
    keywords: {
      entertainment: [
        "エンターテインメント", "エンタメ", "ユーチューバー", "クリエイター", "日本 ユーチューバー",
        "japanese youtuber", "japanese channel", "japanese creator", "japanese entertainment",
        "日本のエンタメ", "人気ユーチューバー", "有名ユーチューバー", "top japanese youtuber",
        "best japanese channel", "popular japanese creator", "japan youtuber", "japan channel"
      ],
      music: [
        "音楽", "J-pop", "日本の音楽", "アーティスト", "歌手", "日本の歌手",
        "japanese music", "j-pop", "japanese singer", "japanese artist", "japanese band",
        "日本のアーティスト", "J-pop music", "japanese pop", "japanese musician", "japan music"
      ],
      gaming: [
        "ゲーム", "ゲーミング", "ゲーム実況", "ゲーマー", "ストリーマー", "日本のゲーム",
        "japanese gaming", "japanese gamer", "japanese streamer", "japanese esports",
        "ゲームクリエイター", "ゲーム配信", "japanese game channel", "japan gaming"
      ],
      sports: [
        "スポーツ", "日本のスポーツ", "野球", "サッカー", "日本の野球", "日本のサッカー",
        "japanese sports", "japanese baseball", "japanese soccer", "japanese athlete",
        "日本のアスリート", "japanese sports channel", "japan sports", "japan athlete"
      ],
      education: [
        "教育", "学習", "講座", "日本の教育", "オンライン講座", "教育チャンネル",
        "japanese education", "japanese learning", "japanese course", "japanese tutorial",
        "日本の学習", "日本の講座", "教育ユーチューバー", "japanese education channel"
      ],
      news: [
        "ニュース", "時事", "日本のニュース", "ニュースチャンネル", "時事番組",
        "japanese news", "japanese journalism", "japanese media", "japanese current events",
        "日本のメディア", "日本のニュース", "ニュースユーチューバー", "japanese news channel"
      ],
      people: [
        "ブログ", "日常", "ライフスタイル", "日本のブログ", "日本の日常", "日本のライフ",
        "japanese vlog", "japanese lifestyle", "japanese daily", "japanese vlogger",
        "日本のインフルエンサー", "日本のクリエイター", "japanese influencer", "japanese creator"
      ],
      howto: [
        "チュートリアル", "ハウツー", "コツ", "ノウハウ", "日本のチュートリアル",
        "japanese tutorial", "japanese howto", "japanese tips", "japanese guide",
        "日本のノウハウ", "日本のガイド", "japanese diy", "japanese tips and tricks"
      ],
      other: [
        "日本 ユーチューバー", "日本 チャンネル", "日本 クリエイター", "人気チャンネル",
        "japanese youtuber", "japanese channel", "japanese creator", "top japanese",
        "best japanese", "popular japanese", "famous japanese", "japanese content"
      ],
    },
  },
  CN: {
    languageCode: "zh",
    regionCode: "CN",
    keywords: {
      entertainment: [
        "娱乐", "娱乐频道", "中国 博主", "中国 创作者", "中国 视频",
        "chinese youtuber", "chinese channel", "chinese creator", "chinese entertainment",
        "中国娱乐", "中国视频", "热门博主", "知名博主", "top chinese youtuber",
        "best chinese channel", "popular chinese creator", "china youtuber", "china channel"
      ],
      music: [
        "音乐", "中国音乐", "歌手", "中国歌手", "中国音乐人", "华语音乐",
        "chinese music", "chinese singer", "chinese artist", "chinese band",
        "中国音乐人", "华语歌手", "chinese pop", "chinese musician", "china music"
      ],
      gaming: [
        "游戏", "游戏直播", "游戏主播", "中国游戏", "游戏频道", "游戏实况",
        "chinese gaming", "chinese gamer", "chinese streamer", "chinese esports",
        "中国游戏主播", "游戏创作者", "chinese game channel", "china gaming"
      ],
      sports: [
        "体育", "中国体育", "足球", "篮球", "中国足球", "中国篮球",
        "chinese sports", "chinese football", "chinese basketball", "chinese athlete",
        "中国运动员", "chinese sports channel", "china sports", "china athlete"
      ],
      education: [
        "教育", "学习", "课程", "中国教育", "在线课程", "教育频道",
        "chinese education", "chinese learning", "chinese course", "chinese tutorial",
        "中国学习", "中国课程", "教育博主", "chinese education channel"
      ],
      news: [
        "新闻", "时事", "中国新闻", "新闻频道", "时事节目", "中国时事",
        "chinese news", "chinese journalism", "chinese media", "chinese current events",
        "中国媒体", "中国新闻", "新闻博主", "chinese news channel"
      ],
      people: [
        "vlog", "日常", "生活方式", "中国vlog", "中国日常", "中国生活",
        "chinese vlog", "chinese lifestyle", "chinese daily", "chinese vlogger",
        "中国网红", "中国创作者", "chinese influencer", "chinese creator"
      ],
      howto: [
        "教程", "技巧", "方法", "中国教程", "中国技巧", "中国方法",
        "chinese tutorial", "chinese howto", "chinese tips", "chinese guide",
        "中国方法", "中国指南", "chinese diy", "chinese tips and tricks"
      ],
      other: [
        "中国 博主", "中国 频道", "中国 创作者", "热门频道", "知名频道",
        "chinese youtuber", "chinese channel", "chinese creator", "top chinese",
        "best chinese", "popular chinese", "famous chinese", "chinese content"
      ],
    },
  },
  DE: {
    languageCode: "de",
    regionCode: "DE",
    keywords: {
      entertainment: [
        "Unterhaltung", "Entertainment", "deutscher YouTuber", "deutscher Kanal", "deutscher Creator",
        "german youtuber", "german channel", "german creator", "german entertainment",
        "deutsche Unterhaltung", "deutscher Content", "top deutscher YouTuber", "bester deutscher Kanal",
        "popular deutscher Creator", "germany youtuber", "germany channel", "germany creator"
      ],
      music: [
        "Musik", "deutsche Musik", "deutscher Sänger", "deutscher Künstler", "deutsche Band",
        "german music", "german singer", "german artist", "german band", "german musician",
        "deutsche Musik", "deutscher Musiker", "german pop", "germany music", "germany singer"
      ],
      gaming: [
        "Gaming", "Spiele", "deutscher Gamer", "deutscher Streamer", "deutsches Gaming",
        "german gaming", "german gamer", "german streamer", "german esports",
        "deutscher Gaming-Kanal", "deutscher Spiele-Kanal", "german game channel", "germany gaming"
      ],
      sports: [
        "Sport", "deutscher Sport", "Fußball", "deutscher Fußball", "deutscher Sportler",
        "german sports", "german football", "german soccer", "german athlete",
        "deutscher Sportler", "deutscher Sport-Kanal", "german sports channel", "germany sports"
      ],
      education: [
        "Bildung", "Lernen", "deutsche Bildung", "deutscher Kurs", "deutsches Tutorial",
        "german education", "german learning", "german course", "german tutorial",
        "deutscher Bildungs-Kanal", "deutscher Lern-Kanal", "german education channel", "germany education"
      ],
      news: [
        "Nachrichten", "deutsche Nachrichten", "deutscher Journalismus", "deutsche Medien",
        "german news", "german journalism", "german media", "german current events",
        "deutscher Nachrichten-Kanal", "deutsche Medien", "german news channel", "germany news"
      ],
      people: [
        "Vlog", "deutscher Vlog", "deutscher Lifestyle", "deutscher Vlogger",
        "german vlog", "german lifestyle", "german daily", "german vlogger",
        "deutscher Influencer", "deutscher Creator", "german influencer", "german creator"
      ],
      howto: [
        "Tutorial", "Anleitung", "deutsches Tutorial", "deutsche Anleitung", "deutsche Tipps",
        "german tutorial", "german howto", "german tips", "german guide",
        "deutsche Tipps", "deutsche Anleitung", "german diy", "german tips and tricks"
      ],
      other: [
        "deutscher YouTuber", "deutscher Kanal", "deutscher Creator", "bester deutscher Kanal",
        "german youtuber", "german channel", "german creator", "top german",
        "best german", "popular german", "famous german", "german content"
      ],
    },
  },
  GB: {
    languageCode: "en",
    regionCode: "GB",
    keywords: {
      entertainment: [
        "british youtuber", "british channel", "british creator", "british entertainment",
        "uk youtuber", "uk channel", "uk creator", "uk entertainment",
        "british content", "british comedy", "british vlog", "top british youtuber",
        "best british channel", "popular british creator", "england youtuber", "england channel"
      ],
      music: [
        "british music", "british singer", "british artist", "british band",
        "uk music", "uk singer", "uk artist", "uk band",
        "british musician", "british pop", "uk pop", "england music", "england singer"
      ],
      gaming: [
        "british gaming", "british gamer", "british streamer", "british esports",
        "uk gaming", "uk gamer", "uk streamer", "uk esports",
        "british game channel", "uk game channel", "england gaming", "england gamer"
      ],
      sports: [
        "british sports", "british football", "british soccer", "british athlete",
        "uk sports", "uk football", "uk soccer", "uk athlete",
        "british sports channel", "uk sports channel", "england sports", "england football"
      ],
      education: [
        "british education", "british learning", "british course", "british tutorial",
        "uk education", "uk learning", "uk course", "uk tutorial",
        "british education channel", "uk education channel", "england education", "england learning"
      ],
      news: [
        "british news", "british journalism", "british media", "british current events",
        "uk news", "uk journalism", "uk media", "uk current events",
        "british news channel", "uk news channel", "england news", "england journalism"
      ],
      people: [
        "british vlog", "british lifestyle", "british daily", "british vlogger",
        "uk vlog", "uk lifestyle", "uk daily", "uk vlogger",
        "british influencer", "british creator", "uk influencer", "uk creator"
      ],
      howto: [
        "british tutorial", "british howto", "british tips", "british guide",
        "uk tutorial", "uk howto", "uk tips", "uk guide",
        "british diy", "british tips and tricks", "uk diy", "uk tips and tricks"
      ],
      other: [
        "british youtuber", "british channel", "british creator", "top british",
        "best british", "popular british", "famous british", "british content",
        "uk youtuber", "uk channel", "uk creator", "top uk", "best uk"
      ],
    },
  },
  FR: {
    languageCode: "fr",
    regionCode: "FR",
    keywords: {
      entertainment: [
        "divertissement", "amusement", "youtubeur français", "chaîne française", "créateur français",
        "french youtuber", "french channel", "french creator", "french entertainment",
        "divertissement français", "contenu français", "top youtubeur français", "meilleure chaîne française",
        "créateur français populaire", "france youtuber", "france channel", "france creator"
      ],
      music: [
        "musique", "musique française", "chanteur français", "artiste français", "groupe français",
        "french music", "french singer", "french artist", "french band", "french musician",
        "musique française", "musicien français", "french pop", "france music", "france singer"
      ],
      gaming: [
        "gaming", "jeux", "gamer français", "streamer français", "gaming français",
        "french gaming", "french gamer", "french streamer", "french esports",
        "chaîne gaming française", "chaîne jeux française", "french game channel", "france gaming"
      ],
      sports: [
        "sports", "sport français", "football", "football français", "sportif français",
        "french sports", "french football", "french soccer", "french athlete",
        "sportif français", "chaîne sport française", "french sports channel", "france sports"
      ],
      education: [
        "éducation", "apprentissage", "éducation française", "cours français", "tutoriel français",
        "french education", "french learning", "french course", "french tutorial",
        "chaîne éducation française", "chaîne apprentissage française", "french education channel", "france education"
      ],
      news: [
        "actualités", "actualités françaises", "journalisme français", "médias français",
        "french news", "french journalism", "french media", "french current events",
        "chaîne actualités française", "médias français", "french news channel", "france news"
      ],
      people: [
        "vlog", "vlog français", "mode de vie français", "vlogueur français",
        "french vlog", "french lifestyle", "french daily", "french vlogger",
        "influenceur français", "créateur français", "french influencer", "french creator"
      ],
      howto: [
        "tutoriel", "guide", "tutoriel français", "guide français", "conseils français",
        "french tutorial", "french howto", "french tips", "french guide",
        "conseils français", "guide français", "french diy", "french tips and tricks"
      ],
      other: [
        "youtubeur français", "chaîne française", "créateur français", "meilleure chaîne française",
        "french youtuber", "french channel", "french creator", "top french",
        "best french", "popular french", "famous french", "french content"
      ],
    },
  },
  BR: {
    languageCode: "pt",
    regionCode: "BR",
    keywords: {
      entertainment: [
        "entretenimento", "youtuber brasileiro", "canal brasileiro", "criador brasileiro",
        "brazilian youtuber", "brazilian channel", "brazilian creator", "brazilian entertainment",
        "entretenimento brasileiro", "conteúdo brasileiro", "top youtuber brasileiro", "melhor canal brasileiro",
        "criador brasileiro popular", "brazil youtuber", "brazil channel", "brazil creator"
      ],
      music: [
        "música", "música brasileira", "cantor brasileiro", "artista brasileiro", "banda brasileira",
        "brazilian music", "brazilian singer", "brazilian artist", "brazilian band", "brazilian musician",
        "música brasileira", "músico brasileiro", "brazilian pop", "brazil music", "brazil singer"
      ],
      gaming: [
        "gaming", "jogos", "gamer brasileiro", "streamer brasileiro", "gaming brasileiro",
        "brazilian gaming", "brazilian gamer", "brazilian streamer", "brazilian esports",
        "canal gaming brasileiro", "canal jogos brasileiro", "brazilian game channel", "brazil gaming"
      ],
      sports: [
        "esportes", "esporte brasileiro", "futebol", "futebol brasileiro", "atleta brasileiro",
        "brazilian sports", "brazilian football", "brazilian soccer", "brazilian athlete",
        "atleta brasileiro", "canal esportes brasileiro", "brazilian sports channel", "brazil sports"
      ],
      education: [
        "educação", "aprendizado", "educação brasileira", "curso brasileiro", "tutorial brasileiro",
        "brazilian education", "brazilian learning", "brazilian course", "brazilian tutorial",
        "canal educação brasileiro", "canal aprendizado brasileiro", "brazilian education channel", "brazil education"
      ],
      news: [
        "notícias", "notícias brasileiras", "jornalismo brasileiro", "mídia brasileira",
        "brazilian news", "brazilian journalism", "brazilian media", "brazilian current events",
        "canal notícias brasileiro", "mídia brasileira", "brazilian news channel", "brazil news"
      ],
      people: [
        "vlog", "vlog brasileiro", "estilo de vida brasileiro", "vlogger brasileiro",
        "brazilian vlog", "brazilian lifestyle", "brazilian daily", "brazilian vlogger",
        "influenciador brasileiro", "criador brasileiro", "brazilian influencer", "brazilian creator"
      ],
      howto: [
        "tutorial", "guia", "tutorial brasileiro", "guia brasileiro", "dicas brasileiras",
        "brazilian tutorial", "brazilian howto", "brazilian tips", "brazilian guide",
        "dicas brasileiras", "guia brasileiro", "brazilian diy", "brazilian tips and tricks"
      ],
      other: [
        "youtuber brasileiro", "canal brasileiro", "criador brasileiro", "melhor canal brasileiro",
        "brazilian youtuber", "brazilian channel", "brazilian creator", "top brazilian",
        "best brazilian", "popular brazilian", "famous brazilian", "brazilian content"
      ],
    },
  },
  MX: {
    languageCode: "es",
    regionCode: "MX",
    keywords: {
      entertainment: [
        "entretenimiento", "youtuber mexicano", "canal mexicano", "creador mexicano",
        "mexican youtuber", "mexican channel", "mexican creator", "mexican entertainment",
        "entretenimiento mexicano", "contenido mexicano", "top youtuber mexicano", "mejor canal mexicano",
        "creador mexicano popular", "mexico youtuber", "mexico channel", "mexico creator"
      ],
      music: [
        "música", "música mexicana", "cantante mexicano", "artista mexicano", "banda mexicana",
        "mexican music", "mexican singer", "mexican artist", "mexican band", "mexican musician",
        "música mexicana", "músico mexicano", "mexican pop", "mexico music", "mexico singer"
      ],
      gaming: [
        "gaming", "juegos", "gamer mexicano", "streamer mexicano", "gaming mexicano",
        "mexican gaming", "mexican gamer", "mexican streamer", "mexican esports",
        "canal gaming mexicano", "canal juegos mexicano", "mexican game channel", "mexico gaming"
      ],
      sports: [
        "deportes", "deporte mexicano", "fútbol", "fútbol mexicano", "atleta mexicano",
        "mexican sports", "mexican football", "mexican soccer", "mexican athlete",
        "atleta mexicano", "canal deportes mexicano", "mexican sports channel", "mexico sports"
      ],
      education: [
        "educación", "aprendizaje", "educación mexicana", "curso mexicano", "tutorial mexicano",
        "mexican education", "mexican learning", "mexican course", "mexican tutorial",
        "canal educación mexicano", "canal aprendizaje mexicano", "mexican education channel", "mexico education"
      ],
      news: [
        "noticias", "noticias mexicanas", "periodismo mexicano", "medios mexicanos",
        "mexican news", "mexican journalism", "mexican media", "mexican current events",
        "canal noticias mexicano", "medios mexicanos", "mexican news channel", "mexico news"
      ],
      people: [
        "vlog", "vlog mexicano", "estilo de vida mexicano", "vlogger mexicano",
        "mexican vlog", "mexican lifestyle", "mexican daily", "mexican vlogger",
        "influenciador mexicano", "creador mexicano", "mexican influencer", "mexican creator"
      ],
      howto: [
        "tutorial", "guía", "tutorial mexicano", "guía mexicana", "consejos mexicanos",
        "mexican tutorial", "mexican howto", "mexican tips", "mexican guide",
        "consejos mexicanos", "guía mexicana", "mexican diy", "mexican tips and tricks"
      ],
      other: [
        "youtuber mexicano", "canal mexicano", "creador mexicano", "mejor canal mexicano",
        "mexican youtuber", "mexican channel", "mexican creator", "top mexican",
        "best mexican", "popular mexican", "famous mexican", "mexican content"
      ],
    },
  },
};

// 검색 함수
async function searchChannels(
  query: string,
  maxResults: number = 50,
  regionCode: string,
  languageCode: string,
  order: "viewCount" | "rating" | "relevance" = "viewCount"
): Promise<Array<{ channelId: string; channelName: string }>> {
  const apiKey = getNextApiKey();
  
  try {
    const params = new URLSearchParams({
      part: "snippet",
      q: query,
      type: "channel",
      maxResults: String(Math.min(maxResults, 50)),
      order: order,
      regionCode: regionCode,
      hl: languageCode,
      relevanceLanguage: languageCode,
      key: apiKey,
    });
    
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    
    if (!response.ok) {
      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error?.errors?.[0]?.reason === "quotaExceeded") {
          console.error(`  ⚠️ API 키 할당량 소진: ${apiKey.substring(0, 20)}... (다음 키로 전환)`);
          // 다음 키로 전환하기 위해 인덱스 증가
          currentKeyIndex++;
          // 잠시 대기 후 재시도
          await new Promise(resolve => setTimeout(resolve, 1000));
          return [];
        }
        console.error(`  ⚠️ API 오류 (${response.status}): ${apiKey.substring(0, 20)}...`);
        return [];
      }
      return [];
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

// 채널 상세 정보 가져오기
async function fetchChannelDetails(channelIds: string[], countryCode: string): Promise<any[]> {
  if (channelIds.length === 0) return [];
  
  const apiKey = getNextApiKey();
  const batchSize = 50;
  const results: any[] = [];
  
  for (let i = 0; i < channelIds.length; i += batchSize) {
    const batch = channelIds.slice(i, i + batchSize);
    
    try {
      const ids = batch.join(",");
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${ids}&key=${apiKey}`
      );
      
      if (!response.ok) {
        if (response.status === 403) {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.error?.errors?.[0]?.reason === "quotaExceeded") {
            console.error(`  ⚠️ API 키 할당량 소진 (다음 키로 전환)`);
            currentKeyIndex++;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          continue;
        }
        continue;
      }
      
      const data = await response.json();
      
      if (data.items) {
        for (const item of data.items) {
          const stats = item.statistics;
          const snippet = item.snippet;
          
          const subscriberCount = parseInt(stats.subscriberCount || "0");
          const viewCount = parseInt(stats.viewCount || "0");
          
          const profileImageUrl = snippet.thumbnails?.high?.url 
            || snippet.thumbnails?.medium?.url 
            || snippet.thumbnails?.default?.url 
            || null;
          
          // 최소 기준 체크 (완화된 기준)
          if (subscriberCount >= MIN_SUBSCRIBER_COUNT && viewCount >= MIN_VIEW_COUNT && profileImageUrl) {
            results.push({
              channelId: item.id,
              channelName: snippet.title,
              handle: snippet.customUrl?.replace("@", "") || null,
              profileImageUrl: profileImageUrl,
              subscriberCount,
              totalViewCount: viewCount,
              videoCount: parseInt(stats.videoCount || "0"),
              country: snippet.country || countryCode,
              description: snippet.description || null,
              channelCreatedAt: snippet.publishedAt ? new Date(snippet.publishedAt) : null,
            });
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error: any) {
      console.error(`  ❌ 배치 오류:`, error.message);
    }
  }
  
  return results;
}

// 카테고리 가져오기 또는 생성
async function getOrCreateCategory(name: string, nameEn: string): Promise<string> {
  let category = await prisma.category.findUnique({
    where: { name },
  });
  
  if (!category) {
    category = await prisma.category.create({
      data: { name, nameEn },
    });
  }
  
  return category.id;
}

// 채널 저장
async function saveChannel(channelData: any, categoryId: string, countryCode: string): Promise<boolean> {
  try {
    const existing = await prisma.youTubeChannel.findUnique({
      where: { channelId: channelData.channelId },
    });
    
    if (existing) {
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
          country: countryCode,
          lastUpdated: new Date(),
        },
      });
      return false;
    }
    
    await prisma.youTubeChannel.create({
      data: {
        channelId: channelData.channelId,
        channelName: channelData.channelName,
        handle: channelData.handle,
        profileImageUrl: channelData.profileImageUrl,
        categoryId,
        subscriberCount: BigInt(channelData.subscriberCount),
        totalViewCount: BigInt(channelData.totalViewCount),
        videoCount: channelData.videoCount,
        description: channelData.description,
        country: countryCode,
        channelCreatedAt: channelData.channelCreatedAt,
      },
    });
    
    return true;
  } catch (error: any) {
    console.error(`  ❌ 저장 오류 (${channelData.channelId}):`, error.message);
    return false;
  }
}

// 카테고리별 수집
async function collectForCategory(
  countryCode: string,
  countryName: string,
  categoryId: string,
  categoryName: string,
  keywords: string[],
  languageCode: string,
  regionCode: string
) {
  console.log(`\n📂 ${countryName} - ${categoryName} 카테고리 수집 시작...`);
  
  const allChannelIds = new Set<string>();
  const orders: Array<"viewCount" | "rating" | "relevance"> = ["viewCount", "rating", "relevance"];
  
  // 각 키워드로 검색 (최대 1000개까지 수집)
  let searchCount = 0;
  for (const keyword of keywords.slice(0, 20)) { // 상위 20개 키워드만 사용
    for (const order of orders) {
      if (allChannelIds.size >= 1000) break;
      
      searchCount++;
      const channels = await searchChannels(keyword, 50, regionCode, languageCode, order);
      
      if (channels.length > 0) {
        for (const ch of channels) {
          if (ch.channelId) {
            allChannelIds.add(ch.channelId);
          }
        }
        // 진행 상황 출력 (10회마다)
        if (searchCount % 10 === 0) {
          console.log(`    진행: ${searchCount}회 검색, ${allChannelIds.size}개 채널 ID 수집`);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 200)); // 150ms → 200ms로 증가
    }
    
    if (allChannelIds.size >= 1000) break;
  }
  
  console.log(`  📊 ${allChannelIds.size}개 채널 ID 수집 완료`);
  
  if (allChannelIds.size === 0) {
    return { collected: 0, saved: 0 };
  }
  
  // 상세 정보 가져오기
  const channelIdsArray = Array.from(allChannelIds);
  const channelDetails = await fetchChannelDetails(channelIdsArray, countryCode);
  
  console.log(`  📊 ${channelDetails.length}개 채널 상세 정보 수집 완료`);
  
  // 저장
  let savedCount = 0;
  for (const channel of channelDetails) {
    const saved = await saveChannel(channel, categoryId, countryCode);
    if (saved) savedCount++;
  }
  
  console.log(`  💾 ${savedCount}개 새 채널 저장 완료`);
  
  return { collected: channelDetails.length, saved: savedCount };
}

// 단일 국가 수집 함수 (export)
export async function collectPriorityCountry(
  countryCode: string, 
  countryName: string
): Promise<{ collected: number; saved: number } | undefined> {
  const config = COUNTRY_CONFIG[countryCode];
  if (!config) {
    console.error(`❌ ${countryName} (${countryCode}) 설정이 없습니다.`);
    return undefined;
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`🌍 ${countryName} (${countryCode}) 수집 시작`);
  console.log(`${"=".repeat(60)}\n`);

  const categories = [
    { id: "entertainment", name: "엔터테인먼트", nameEn: "Entertainment" },
    { id: "music", name: "음악", nameEn: "Music" },
    { id: "gaming", name: "게임", nameEn: "Gaming" },
    { id: "sports", name: "스포츠", nameEn: "Sports" },
    { id: "education", name: "교육", nameEn: "Education" },
    { id: "news", name: "뉴스/정치", nameEn: "News/Politics" },
    { id: "people", name: "인물/블로그", nameEn: "People/Blog" },
    { id: "howto", name: "노하우/스타일", nameEn: "Howto/Style" },
    { id: "other", name: "기타", nameEn: "Other" },
  ];

  let countryCollected = 0;
  let countrySaved = 0;

  for (const category of categories) {
    const categoryId = await getOrCreateCategory(category.name, category.nameEn);
    const keywords = config.keywords[category.id] || [];

    if (keywords.length === 0) {
      console.log(`  ⚠️ ${category.name}: 키워드 없음, 스킵`);
      continue;
    }

    const result = await collectForCategory(
      countryCode,
      countryName,
      categoryId,
      category.name,
      keywords,
      config.languageCode,
      config.regionCode
    );

    countryCollected += result.collected;
    countrySaved += result.saved;

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 국가별 최종 확인
  const finalCount = await prisma.youTubeChannel.count({
    where: { country: countryCode },
  });

  console.log(`\n✅ ${countryName} 수집 완료:`);
  console.log(`   수집: ${countryCollected}개, 저장: ${countrySaved}개`);
  console.log(`   최종 채널 수: ${finalCount}개\n`);

  return { collected: countryCollected, saved: countrySaved };
}

// 메인 실행
async function main() {
  const priorityCountries = [
    { code: "KR", name: "한국" },
    { code: "JP", name: "일본" },
    { code: "CN", name: "중국" },
    { code: "DE", name: "독일" },
    { code: "GB", name: "영국" },
    { code: "FR", name: "프랑스" },
    { code: "BR", name: "브라질" },
    { code: "MX", name: "멕시코" },
  ];

  console.log("🚀 우선순위 국가 채널 수집 시작...\n");
  console.log(`📊 목표: 각 국가별 최소 200개 이상 채널 확보\n`);
  console.log(`수집 대상 국가: ${priorityCountries.map(c => c.name).join(", ")}\n`);
  
  if (YOUTUBE_API_KEYS.length === 0) {
    console.error("❌ YouTube API 키가 설정되지 않았습니다.");
    process.exit(1);
  }
  
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL이 설정되지 않았습니다.");
    process.exit(1);
  }
  
  try {
    await prisma.$connect();
    console.log("✅ 데이터베이스 연결 성공\n");
    
    const categories = [
      { id: "entertainment", name: "엔터테인먼트", nameEn: "Entertainment" },
      { id: "music", name: "음악", nameEn: "Music" },
      { id: "gaming", name: "게임", nameEn: "Gaming" },
      { id: "sports", name: "스포츠", nameEn: "Sports" },
      { id: "education", name: "교육", nameEn: "Education" },
      { id: "news", name: "뉴스/정치", nameEn: "News/Politics" },
      { id: "people", name: "인물/블로그", nameEn: "People/Blog" },
      { id: "howto", name: "노하우/스타일", nameEn: "Howto/Style" },
      { id: "other", name: "기타", nameEn: "Other" },
    ];
    
    let totalCollected = 0;
    let totalSaved = 0;
    
    for (const country of priorityCountries) {
      const result = await collectPriorityCountry(country.code, country.name);
      if (result) {
        totalCollected += result.collected;
        totalSaved += result.saved;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 전체 최종 확인
    console.log(`\n\n${"=".repeat(60)}`);
    console.log("✅ 전체 수집 완료!");
    console.log(`${"=".repeat(60)}\n`);
    console.log(`📊 총 수집: ${totalCollected}개`);
    console.log(`💾 총 저장: ${totalSaved}개\n`);
    
    console.log("📈 국가별 최종 채널 수:");
    for (const country of priorityCountries) {
      const count = await prisma.youTubeChannel.count({
        where: { country: country.code },
      });
      const status = count >= 200 ? "✅" : count >= 100 ? "⚠️" : "❌";
      console.log(`  ${status} ${country.name} (${country.code}): ${count}개`);
    }
    
  } catch (error: any) {
    console.error("❌ 오류 발생:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);

