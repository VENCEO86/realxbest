/**
 * 각 국가별로 최소 100개 이상의 채널을 수집하는 스크립트
 * 
 * 사용법:
 *   npx tsx scripts/collect-channels-by-country-100.ts [국가코드]
 *   예: npx tsx scripts/collect-channels-by-country-100.ts KR
 *   예: npx tsx scripts/collect-channels-by-country-100.ts (모든 국가)
 */

import { PrismaClient } from "@prisma/client";
import { searchChannels } from "@/lib/youtube-api";
import { COUNTRIES } from "@/lib/countries";

const prisma = new PrismaClient();

// 국가별 검색 키워드 (각 국가당 최소 100개 채널 수집을 위한 키워드)
const COUNTRY_KEYWORDS: Record<string, string[]> = {
  // 남미
  CL: ["chile", "chilean", "chile youtube", "chile vlog", "chile music", "chile gaming", "chile education", "칠레", "칠레 유튜버"],
  AR: ["argentina", "argentine", "argentina youtube", "argentina vlog", "argentina music", "argentina gaming", "아르헨티나", "아르헨티나 유튜버"],
  UY: ["uruguay", "uruguayan", "uruguay youtube", "uruguay vlog", "우루과이", "우루과이 유튜버"],
  BR: ["brazil", "brazilian", "brasil", "brazil youtube", "brazil vlog", "brazil music", "brazil gaming", "brazil comedy", "브라질", "브라질 유튜버"],
  CO: ["colombia", "colombian", "colombia youtube", "colombia vlog", "colombia music", "콜롬비아", "콜롬비아 유튜버"],
  PE: ["peru", "peruvian", "peru youtube", "peru vlog", "peru music", "페루", "페루 유튜버"],
  EC: ["ecuador", "ecuadorian", "ecuador youtube", "ecuador vlog", "에콰도르", "에콰도르 유튜버"],
  PY: ["paraguay", "paraguayan", "paraguay youtube", "paraguay vlog", "파라과이", "파라과이 유튜버"],
  BO: ["bolivia", "bolivian", "bolivia youtube", "bolivia vlog", "볼리비아", "볼리비아 유튜버"],
  VE: ["venezuela", "venezuelan", "venezuela youtube", "venezuela vlog", "베네수엘라", "베네수엘라 유튜버"],
  GY: ["guyana", "guyanese", "guyana youtube", "guyana vlog", "가이아나", "가이아나 유튜버"],
  SR: ["suriname", "surinamese", "suriname youtube", "suriname vlog", "수리남", "수리남 유튜버"],
  GF: ["french guiana", "guyane", "french guiana youtube", "프랑스령 기아나", "프랑스령 기아나 유튜버"],
  FK: ["falkland islands", "falklands", "falkland youtube", "포클랜드 제도", "포클랜드 제도 유튜버"],
  
  // 아시아
  BD: ["bangladesh", "bangladeshi", "bangladesh youtube", "bangladesh vlog", "bangladesh music", "방글라데시", "방글라데시 유튜버"],
  PK: ["pakistan", "pakistani", "pakistan youtube", "pakistan vlog", "pakistan music", "pakistan gaming", "파키스탄", "파키스탄 유튜버"],
  MM: ["myanmar", "burma", "myanmar youtube", "myanmar vlog", "미얀마", "미얀마 유튜버"],
  KH: ["cambodia", "cambodian", "cambodia youtube", "cambodia vlog", "캄보디아", "캄보디아 유튜버"],
  LA: ["laos", "laotian", "laos youtube", "laos vlog", "라오스", "라오스 유튜버"],
  BN: ["brunei", "bruneian", "brunei youtube", "brunei vlog", "브루나이", "브루나이 유튜버"],
  
  // 유럽
  DE: ["germany", "german", "deutschland", "germany youtube", "germany vlog", "germany music", "germany gaming", "독일", "독일 유튜버"],
  GB: ["uk", "britain", "british", "england", "uk youtube", "uk vlog", "uk music", "uk gaming", "영국", "영국 유튜버"],
  FR: ["france", "french", "france youtube", "france vlog", "france music", "france gaming", "프랑스", "프랑스 유튜버"],
  NL: ["netherlands", "dutch", "holland", "netherlands youtube", "netherlands vlog", "네덜란드", "네덜란드 유튜버"],
  CH: ["switzerland", "swiss", "switzerland youtube", "switzerland vlog", "스위스", "스위스 유튜버"],
  SE: ["sweden", "swedish", "sweden youtube", "sweden vlog", "sweden music", "스웨덴", "스웨덴 유튜버"],
  BE: ["belgium", "belgian", "belgium youtube", "belgium vlog", "벨기에", "벨기에 유튜버"],
  AT: ["austria", "austrian", "austria youtube", "austria vlog", "오스트리아", "오스트리아 유튜버"],
  IE: ["ireland", "irish", "ireland youtube", "ireland vlog", "아일랜드", "아일랜드 유튜버"],
  NO: ["norway", "norwegian", "norway youtube", "norway vlog", "노르웨이", "노르웨이 유튜버"],
  DK: ["denmark", "danish", "denmark youtube", "denmark vlog", "덴마크", "덴마크 유튜버"],
  FI: ["finland", "finnish", "finland youtube", "finland vlog", "핀란드", "핀란드 유튜버"],
  LU: ["luxembourg", "luxembourgish", "luxembourg youtube", "luxembourg vlog", "룩셈부르크", "룩셈부르크 유튜버"],
  LI: ["liechtenstein", "liechtenstein youtube", "liechtenstein vlog", "리히텐슈타인", "리히텐슈타인 유튜버"],
  MT: ["malta", "maltese", "malta youtube", "malta vlog", "몰타", "몰타 유튜버"],
  AD: ["andorra", "andorran", "andorra youtube", "andorra vlog", "안도라", "안도라 유튜버"],
  IT: ["italy", "italian", "italy youtube", "italy vlog", "italy music", "이탈리아", "이탈리아 유튜버"],
  ES: ["spain", "spanish", "spain youtube", "spain vlog", "spain music", "스페인", "스페인 유튜버"],
  PL: ["poland", "polish", "poland youtube", "poland vlog", "폴란드", "폴란드 유튜버"],
  RU: ["russia", "russian", "russia youtube", "russia vlog", "russia music", "러시아", "러시아 유튜버"],
  PT: ["portugal", "portuguese", "portugal youtube", "portugal vlog", "포르투갈", "포르투갈 유튜버"],
  GR: ["greece", "greek", "greece youtube", "greece vlog", "그리스", "그리스 유튜버"],
  CZ: ["czech", "czech republic", "czech youtube", "czech vlog", "체코", "체코 유튜버"],
  RO: ["romania", "romanian", "romania youtube", "romania vlog", "루마니아", "루마니아 유튜버"],
  HU: ["hungary", "hungarian", "hungary youtube", "hungary vlog", "헝가리", "헝가리 유튜버"],
  UA: ["ukraine", "ukrainian", "ukraine youtube", "ukraine vlog", "우크라이나", "우크라이나 유튜버"],
  
  // 기타 국가들도 추가
  KR: ["korea", "korean", "k-pop", "korea youtube", "korea vlog", "한국", "한국 유튜버", "한국어"],
  JP: ["japan", "japanese", "japan youtube", "japan vlog", "일본", "일본 유튜버"],
  CN: ["china", "chinese", "china youtube", "china vlog", "중국", "중국 유튜버"],
  US: ["usa", "america", "american", "usa youtube", "usa vlog", "미국", "미국 유튜버"],
  CA: ["canada", "canadian", "canada youtube", "canada vlog", "캐나다", "캐나다 유튜버"],
  AU: ["australia", "australian", "australia youtube", "australia vlog", "호주", "호주 유튜버"],
  NZ: ["new zealand", "kiwi", "new zealand youtube", "new zealand vlog", "뉴질랜드", "뉴질랜드 유튜버"],
  IN: ["india", "indian", "india youtube", "india vlog", "india music", "인도", "인도 유튜버"],
  TH: [
    "thailand", "thai", "thailand youtube", "thailand vlog", "thailand music", "thailand gaming",
    "thailand comedy", "thailand travel", "thailand food", "thailand beauty", "thailand fashion",
    "thailand tech", "thailand education", "thailand sports", "thailand news",
    "태국", "태국 유튜버", "태국 음악", "태국 게임", "태국 여행", "태국 요리",
    "thai youtuber", "thai channel", "thai creator", "thai influencer",
    "bangkok youtube", "bangkok vlog", "thailand popular", "thailand trending",
  ],
  VN: ["vietnam", "vietnamese", "vietnam youtube", "vietnam vlog", "베트남", "베트남 유튜버"],
  PH: ["philippines", "filipino", "philippines youtube", "philippines vlog", "필리핀", "필리핀 유튜버"],
  ID: ["indonesia", "indonesian", "indonesia youtube", "indonesia vlog", "인도네시아", "인도네시아 유튜버"],
  MY: ["malaysia", "malaysian", "malaysia youtube", "malaysia vlog", "말레이시아", "말레이시아 유튜버"],
  SG: ["singapore", "singaporean", "singapore youtube", "singapore vlog", "싱가포르", "싱가포르 유튜버"],
  TW: ["taiwan", "taiwanese", "taiwan youtube", "taiwan vlog", "대만", "대만 유튜버"],
  HK: ["hong kong", "hongkong", "hong kong youtube", "hong kong vlog", "홍콩", "홍콩 유튜버"],
  SA: ["saudi arabia", "saudi", "saudi arabia youtube", "saudi arabia vlog", "사우디아라비아", "사우디아라비아 유튜버"],
  AE: ["uae", "united arab emirates", "uae youtube", "uae vlog", "아랍에미리트", "아랍에미리트 유튜버"],
  IL: ["israel", "israeli", "israel youtube", "israel vlog", "이스라엘", "이스라엘 유튜버"],
  TR: ["turkey", "turkish", "turkey youtube", "turkey vlog", "터키", "터키 유튜버"],
  EG: ["egypt", "egyptian", "egypt youtube", "egypt vlog", "이집트", "이집트 유튜버"],
  ZA: ["south africa", "south african", "south africa youtube", "south africa vlog", "남아프리카", "남아프리카 유튜버"],
  NG: ["nigeria", "nigerian", "nigeria youtube", "nigeria vlog", "나이지리아", "나이지리아 유튜버"],
  KE: ["kenya", "kenyan", "kenya youtube", "kenya vlog", "케냐", "케냐 유튜버"],
  MX: ["mexico", "mexican", "mexico youtube", "mexico vlog", "멕시코", "멕시코 유튜버"],
};

// 카테고리별 추가 키워드 (각 국가 검색 시 사용) - 더 다양하게 확장
const CATEGORY_KEYWORDS = [
  "music", "gaming", "vlog", "comedy", "education", "sports", "cooking", "travel",
  "beauty", "fashion", "tech", "news", "entertainment", "lifestyle",
  "review", "tutorial", "howto", "tips", "daily", "prank", "challenge",
  "reaction", "unboxing", "makeup", "skincare", "fitness", "health",
];

async function searchChannelsForCountry(countryCode: string, countryName: string, targetCount: number = 200) {
  const apiKeys = (process.env.YOUTUBE_API_KEYS || process.env.YOUTUBE_API_KEY || "").split(',').map(k => k.trim()).filter(k => k.length > 0);
  
  if (apiKeys.length === 0) {
    console.error("YouTube API 키가 설정되지 않았습니다.");
    return [];
  }

  // API 키 순환 사용
  let apiKeyIndex = 0;
  const getNextApiKey = () => {
    const key = apiKeys[apiKeyIndex % apiKeys.length];
    apiKeyIndex++;
    return key;
  };

  const keywords = COUNTRY_KEYWORDS[countryCode] || [`${countryName} youtube`, `${countryName} vlog`];
  const allChannels: any[] = [];
  const savedChannels = new Set<string>();
  let searchCount = 0;
  const maxSearches = 50; // 최대 검색 횟수 제한 (쿼터 고려)

  // 1단계: 기본 국가 키워드로 검색
  console.log(`  🔍 1단계: 기본 키워드 검색 (${keywords.length}개 키워드)`);
  for (const keyword of keywords) {
    if (allChannels.length >= targetCount || searchCount >= maxSearches) break;
    
    try {
      const apiKey = getNextApiKey();
      const channels = await searchChannels(keyword, 50, apiKey);
      searchCount++;
      
      // 최소 기준값 필터링
      const validChannels = channels.filter(
        (ch) => ch.subscriberCount >= 1000 && ch.totalViewCount >= 10000
      );
      
      for (const channel of validChannels) {
        if (!savedChannels.has(channel.channelId)) {
          channel.country = countryCode;
          allChannels.push(channel);
          savedChannels.add(channel.channelId);
        }
      }
      
      console.log(`    ✅ "${keyword}": ${validChannels.length}개 유효 채널 발견 (총 ${allChannels.length}개)`);
      
      // Rate limiting 방지
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error: any) {
      if (error.message?.includes("quota") || error.message?.includes("403")) {
        console.error(`    ⚠️  API 쿼터 소진: ${keyword}`);
        break;
      }
      console.error(`    ❌ "${keyword}" 검색 실패:`, error.message);
    }
  }

  // 2단계: 카테고리별 키워드로 추가 검색 (목표치 미달 시)
  if (allChannels.length < targetCount && searchCount < maxSearches) {
    console.log(`  🔍 2단계: 카테고리별 키워드 검색 (목표: ${targetCount}개, 현재: ${allChannels.length}개)`);
    for (const categoryKeyword of CATEGORY_KEYWORDS) {
      if (allChannels.length >= targetCount || searchCount >= maxSearches) break;
      
      const baseKeyword = keywords[0] || countryName.toLowerCase();
      const combinedKeyword = `${baseKeyword} ${categoryKeyword}`;
      
      try {
        const apiKey = getNextApiKey();
        const channels = await searchChannels(combinedKeyword, 50, apiKey);
        searchCount++;
        
        const validChannels = channels.filter(
          (ch) => ch.subscriberCount >= 1000 && ch.totalViewCount >= 10000
        );
        
        for (const channel of validChannels) {
          if (!savedChannels.has(channel.channelId)) {
            channel.country = countryCode;
            allChannels.push(channel);
            savedChannels.add(channel.channelId);
          }
        }
        
        if (validChannels.length > 0) {
          console.log(`    ✅ "${combinedKeyword}": ${validChannels.length}개 유효 채널 발견 (총 ${allChannels.length}개)`);
        }
        
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error: any) {
        if (error.message?.includes("quota") || error.message?.includes("403")) {
          console.error(`    ⚠️  API 쿼터 소진: ${combinedKeyword}`);
          break;
        }
      }
    }
  }

  // 3단계: 인기/트렌딩 키워드로 추가 검색 (여전히 부족할 경우)
  if (allChannels.length < targetCount && searchCount < maxSearches) {
    console.log(`  🔍 3단계: 인기/트렌딩 키워드 검색 (목표: ${targetCount}개, 현재: ${allChannels.length}개)`);
    const popularKeywords = [
      `popular ${countryName} youtubers`,
      `top ${countryName} channels`,
      `best ${countryName} youtube`,
      `trending ${countryName}`,
      `${countryName} famous`,
      `${countryName} celebrity`,
    ];
    
    for (const keyword of popularKeywords) {
      if (allChannels.length >= targetCount || searchCount >= maxSearches) break;
      
      try {
        const apiKey = getNextApiKey();
        const channels = await searchChannels(keyword, 50, apiKey);
        searchCount++;
        
        const validChannels = channels.filter(
          (ch) => ch.subscriberCount >= 1000 && ch.totalViewCount >= 10000
        );
        
        for (const channel of validChannels) {
          if (!savedChannels.has(channel.channelId)) {
            channel.country = countryCode;
            allChannels.push(channel);
            savedChannels.add(channel.channelId);
          }
        }
        
        if (validChannels.length > 0) {
          console.log(`    ✅ "${keyword}": ${validChannels.length}개 유효 채널 발견 (총 ${allChannels.length}개)`);
        }
        
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error: any) {
        if (error.message?.includes("quota") || error.message?.includes("403")) {
          break;
        }
      }
    }
  }

  console.log(`  📊 최종 수집: ${allChannels.length}개 채널 (목표: ${targetCount}개)`);
  
  return allChannels;
}

async function saveChannelToDatabase(channelData: any) {
  try {
    // 카테고리 추론
    let categoryName = "엔터테인먼트";
    const title = (channelData.channelName || "").toLowerCase();
    const description = (channelData.description || "").toLowerCase();
    const combined = `${title} ${description}`;
    
    if (combined.match(/education|tutorial|learning|study|course|lesson|수학|과학|영어|한국어|역사|지리|학습|교육/)) {
      categoryName = "교육";
    } else if (combined.match(/music|song|artist|musician|band|음악|가수|아이돌|K-pop|힙합|랩|발라드/)) {
      categoryName = "음악";
    } else if (combined.match(/gaming|game|playthrough|stream|esports|게임|플레이|스트리밍|e스포츠/)) {
      categoryName = "게임";
    } else if (combined.match(/sports|football|soccer|basketball|스포츠|축구|야구|농구/)) {
      categoryName = "스포츠";
    } else if (combined.match(/cooking|recipe|food|chef|요리|레시피|음식|쿠킹/)) {
      categoryName = "노하우/스타일";
    } else if (combined.match(/news|politics|뉴스|정치|시사/)) {
      categoryName = "뉴스/정치";
    }
    
    // 카테고리 찾기 또는 생성
    let category = await prisma.category.findUnique({
      where: { name: categoryName },
    });
    
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: categoryName,
          nameEn: categoryName,
        },
      });
    }
    
    // 채널 저장 (upsert)
    await prisma.youTubeChannel.upsert({
      where: { channelId: channelData.channelId },
      update: {
        channelName: channelData.channelName,
        handle: channelData.handle,
        profileImageUrl: channelData.profileImageUrl,
        subscriberCount: BigInt(channelData.subscriberCount),
        totalViewCount: BigInt(channelData.totalViewCount),
        videoCount: channelData.videoCount,
        country: channelData.country,
        description: channelData.description,
        lastUpdated: new Date(),
      },
      create: {
        channelId: channelData.channelId,
        channelName: channelData.channelName,
        handle: channelData.handle,
        profileImageUrl: channelData.profileImageUrl,
        categoryId: category.id,
        subscriberCount: BigInt(channelData.subscriberCount),
        totalViewCount: BigInt(channelData.totalViewCount),
        videoCount: channelData.videoCount,
        country: channelData.country,
        description: channelData.description,
        channelCreatedAt: channelData.channelCreatedAt,
      },
    });
    
    return true;
  } catch (error) {
    console.error(`  ❌ 채널 저장 실패 (${channelData.channelName}):`, error);
    return false;
  }
}

async function collectForCountry(countryCode: string, countryName: string) {
  console.log(`\n🌍 ${countryName} (${countryCode}) 채널 수집 시작...\n`);
  
  // 현재 DB에 있는 해당 국가 채널 수 확인
  const existingCount = await prisma.youTubeChannel.count({
    where: { 
      country: countryCode,
      subscriberCount: { gte: BigInt(1000) },
      totalViewCount: { gte: BigInt(10000) },
    },
  });
  
  console.log(`  📊 현재 DB에 저장된 ${countryName} 채널: ${existingCount}개`);
  
  // 목표: 최소 100개, 이상적으로 200개
  const minTarget = 100;
  const idealTarget = 200;
  
  if (existingCount >= idealTarget) {
    console.log(`  ✅ 이미 200개 이상의 채널이 있습니다. 건너뜁니다.\n`);
    return { collected: 0, saved: 0 };
  }
  
  // 목표치 설정: 100개 미만이면 100개까지, 100개 이상이면 200개까지
  const targetCount = existingCount < minTarget ? idealTarget : idealTarget;
  const needToCollect = Math.max(0, targetCount - existingCount);
  
  console.log(`  🎯 목표: 최소 ${minTarget}개 이상 (이상적으로 ${idealTarget}개)`);
  console.log(`  🎯 추가 수집 필요: ${needToCollect}개\n`);
  
  if (needToCollect === 0) {
    console.log(`  ✅ 이미 목표치를 달성했습니다.\n`);
    return { collected: 0, saved: 0 };
  }
  
  // 채널 수집 (목표치보다 더 많이 수집하여 여유 확보)
  const channels = await searchChannelsForCountry(countryCode, countryName, idealTarget);
  console.log(`  ✅ ${channels.length}개 채널 발견\n`);
  
  // 데이터베이스에 저장
  console.log(`  💾 데이터베이스에 저장 중...\n`);
  let savedCount = 0;
  
  for (const channel of channels) {
    const saved = await saveChannelToDatabase(channel);
    if (saved) {
      savedCount++;
    }
    
    if (savedCount % 10 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  
  // 최종 확인
  const finalCount = await prisma.youTubeChannel.count({
    where: { country: countryCode },
  });
  
  console.log(`  ✅ 완료! ${savedCount}개 채널 저장됨 (총 ${finalCount}개)\n`);
  
  return { collected: channels.length, saved: savedCount };
}

async function main() {
  const targetCountry = process.argv[2]; // 명령줄 인자로 국가 코드 받기
  
  console.log("🚀 국가별 채널 수집 시작 (각 국가 최소 100개 목표)...\n");
  
  try {
    await prisma.$connect();
    console.log("✅ 데이터베이스 연결 성공\n");
    
    const countriesToProcess = targetCountry
      ? COUNTRIES.filter(c => c.value === targetCountry && c.value !== "all")
      : COUNTRIES.filter(c => c.value !== "all");
    
    console.log(`📋 처리할 국가: ${countriesToProcess.length}개\n`);
    
    let totalCollected = 0;
    let totalSaved = 0;
    
    for (const country of countriesToProcess) {
      const result = await collectForCountry(country.value, country.label);
      totalCollected += result.collected;
      totalSaved += result.saved;
      
      // Rate limiting 방지 (국가 간 대기)
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    
    console.log("\n📊 최종 통계:");
    console.log(`  - 총 수집된 채널: ${totalCollected.toLocaleString()}개`);
    console.log(`  - 총 저장된 채널: ${totalSaved.toLocaleString()}개\n`);
    
    // 국가별 최종 통계
    console.log("📈 국가별 채널 수 (100개 미만인 국가):");
    for (const country of countriesToProcess) {
      const count = await prisma.youTubeChannel.count({
        where: { country: country.value },
      });
      if (count < 100) {
        console.log(`  - ${country.label} (${country.value}): ${count}개 ⚠️`);
      }
    }
    
  } catch (error) {
    console.error("❌ 오류 발생:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

