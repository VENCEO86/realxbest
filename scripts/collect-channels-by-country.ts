/**
 * 국가별 YouTube 채널 자동 수집 스크립트
 * 각 국가별로 인기 채널을 검색하여 채널 ID 목록을 생성합니다.
 */

import { COUNTRIES } from "../lib/countries";

// 여러 API 키 지원 (쿼터 분산)
const YOUTUBE_API_KEYS = (
  process.env.YOUTUBE_API_KEYS || 
  process.env.YOUTUBE_API_KEY || 
  "AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY"
).split(",").map(key => key.trim()).filter(key => key.length > 0);

let currentKeyIndex = 0;
const keyUsageCount = new Map<string, number>(); // 각 키의 사용 횟수 추적
const exhaustedKeys = new Set<string>(); // 쿼터가 소진된 키 추적

/**
 * 다음 사용 가능한 API 키 가져오기 (순환, 쿼터 소진 키 제외)
 */
function getNextApiKey(): string {
  // 사용 가능한 키만 필터링
  const availableKeys = YOUTUBE_API_KEYS.filter(key => !exhaustedKeys.has(key));
  
  if (availableKeys.length === 0) {
    throw new Error("모든 API 키의 쿼터가 소진되었습니다.");
  }
  
  // 순환 인덱스 계산
  const key = availableKeys[currentKeyIndex % availableKeys.length];
  currentKeyIndex++;
  
  // 사용 횟수 증가
  keyUsageCount.set(key, (keyUsageCount.get(key) || 0) + 1);
  
  return key;
}

/**
 * API 키를 소진된 것으로 표시
 */
function markKeyExhausted(key: string) {
  exhaustedKeys.add(key);
  console.error(`  ⚠️ API 키 쿼터 소진: ${key.substring(0, 20)}... (사용 횟수: ${keyUsageCount.get(key) || 0})`);
}

interface CountryChannels {
  country: string;
  countryCode: string;
  channelIds: string[];
}

/**
 * 특정 국가의 인기 채널 검색
 */
async function searchChannelsByCountry(
  countryCode: string,
  countryName: string,
  maxResults: number = 20
): Promise<string[]> {
  const channelIds: string[] = [];
  
  try {
    // 국가별 검색 쿼리 (다양한 키워드로 검색)
    const queries = [
      `top ${countryName} youtubers`,
      `popular ${countryName} channels`,
      `${countryName} youtube`,
    ];

    for (const query of queries) {
      try {
        // YouTube Search API로 채널 검색 (API 키 순환 사용)
        const apiKey = getNextApiKey();
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&maxResults=${maxResults}&regionCode=${countryCode}&key=${apiKey}`;
        
        const response = await fetch(searchUrl);
        
        if (!response.ok) {
          if (response.status === 403) {
            // 현재 키를 소진된 것으로 표시
            markKeyExhausted(apiKey);
            
            // 사용 가능한 다른 키가 있는지 확인
            const availableKeys = YOUTUBE_API_KEYS.filter(k => !exhaustedKeys.has(k));
            if (availableKeys.length > 0) {
              console.error(`  ⚠️ API 쿼터 초과 (${query}), 다음 키로 시도... (남은 키: ${availableKeys.length}개)`);
              // 다음 사용 가능한 키로 재시도
              const nextKey = getNextApiKey();
              const retryUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&maxResults=${maxResults}&regionCode=${countryCode}&key=${nextKey}`;
              const retryResponse = await fetch(retryUrl);
              if (!retryResponse.ok) {
                if (retryResponse.status === 403) {
                  markKeyExhausted(nextKey);
                }
                console.error(`  ❌ 재시도 실패 (${query}): ${retryResponse.status}`);
                continue;
              }
              // 재시도 성공 시 처리 계속
              const retryData = await retryResponse.json();
              if (retryData.items && retryData.items.length > 0) {
                const ids = retryData.items.map((item: any) => item.snippet.channelId);
                channelIds.push(...ids);
                console.log(`  ✅ ${query}: ${ids.length}개 채널 발견 (재시도 성공)`);
              }
              // Rate limiting 방지
              await new Promise(resolve => setTimeout(resolve, 200));
              continue;
            } else {
              console.error(`  ❌ 모든 API 키의 쿼터가 소진되었습니다.`);
              throw new Error("모든 API 키의 쿼터가 소진되었습니다.");
            }
          }
          console.error(`  ❌ 검색 실패 (${query}): ${response.status}`);
          continue;
        }

        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
          const ids = data.items.map((item: any) => item.snippet.channelId);
          channelIds.push(...ids);
          console.log(`  ✅ ${query}: ${ids.length}개 채널 발견`);
        }

        // Rate limiting 방지
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`  ❌ 오류 (${query}):`, error);
      }
    }

    // 중복 제거
    return [...new Set(channelIds)];
  } catch (error) {
    console.error(`국가 ${countryCode} 검색 오류:`, error);
    return [];
  }
}

/**
 * 모든 국가의 채널 수집
 */
async function collectAllCountryChannels(): Promise<Map<string, string[]>> {
  const countryChannelMap = new Map<string, string[]>();
  
  // "전체 지역" 제외
  const countries = COUNTRIES.filter(c => c.value !== "all");
  
  console.log(`\n📊 총 ${countries.length}개국 채널 수집 시작...\n`);
  
  for (let i = 0; i < countries.length; i++) {
    const country = countries[i];
    const progress = `[${i + 1}/${countries.length}]`;
    
    console.log(`${progress} ${country.label} (${country.value}) 수집 중...`);
    
    const channelIds = await searchChannelsByCountry(
      country.value,
      country.label,
      15 // 국가당 15개씩 (3개 쿼리 × 15 = 최대 45개)
    );
    
    if (channelIds.length > 0) {
      countryChannelMap.set(country.value, channelIds);
      console.log(`  ✅ ${channelIds.length}개 채널 수집 완료\n`);
    } else {
      console.log(`  ⚠️ 채널을 찾지 못했습니다\n`);
    }
    
    // 국가 간 딜레이 (API 쿼터 보호)
    if (i < countries.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return countryChannelMap;
}

/**
 * 결과를 파일로 저장
 */
async function saveResults(channelMap: Map<string, string[]>) {
  const results: CountryChannels[] = [];
  
  for (const [countryCode, channelIds] of channelMap.entries()) {
    const country = COUNTRIES.find(c => c.value === countryCode);
    if (country && channelIds.length > 0) {
      results.push({
        country: country.label,
        countryCode: countryCode,
        channelIds: channelIds,
      });
    }
  }
  
  // JSON 파일로 저장
  const fs = await import("fs/promises");
  await fs.writeFile(
    "scripts/country-channels.json",
    JSON.stringify(results, null, 2),
    "utf-8"
  );
  
  console.log(`\n✅ 결과 저장 완료: scripts/country-channels.json`);
  console.log(`📊 총 ${results.length}개국, ${results.reduce((sum, r) => sum + r.channelIds.length, 0)}개 채널\n`);
  
  // 코드 생성용 출력
  console.log("// 코드에 추가할 채널 ID 목록:\n");
  const allChannelIds: string[] = [];
  results.forEach(r => {
    allChannelIds.push(...r.channelIds);
  });
  
  console.log(`const countryChannelIds = [`);
  allChannelIds.forEach((id, index) => {
    const country = results.find(r => r.channelIds.includes(id));
    const comment = country ? ` // ${country.country}` : "";
    console.log(`  "${id}",${comment}`);
  });
  console.log(`];`);
}

/**
 * 메인 실행
 */
async function main() {
  console.log("🚀 국가별 YouTube 채널 자동 수집 시작\n");
  console.log(`📊 사용 가능한 API 키: ${YOUTUBE_API_KEYS.length}개`);
  YOUTUBE_API_KEYS.forEach((key, index) => {
    console.log(`   [${index + 1}] ${key.substring(0, 20)}...`);
  });
  console.log(`   각 키당 할당량: 10,000 units`);
  console.log(`   총 할당량: ${YOUTUBE_API_KEYS.length * 10000} units\n`);
  
  try {
    const channelMap = await collectAllCountryChannels();
    await saveResults(channelMap);
    
    console.log("\n✅ 모든 작업 완료!");
  } catch (error) {
    console.error("\n❌ 오류 발생:", error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

export { collectAllCountryChannels, searchChannelsByCountry };

