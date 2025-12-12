/**
 * 수집된 국가별 채널을 rankings route에 통합하는 스크립트
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

interface CountryChannels {
  country: string;
  countryCode: string;
  channelIds: string[];
}

async function integrateChannels() {
  try {
    // 수집된 채널 데이터 읽기
    const data = JSON.parse(
      readFileSync(join(process.cwd(), "scripts/country-channels.json"), "utf-8")
    ) as CountryChannels[];

    // 모든 채널 ID 수집
    const allChannelIds: string[] = [];
    const countryMap = new Map<string, string[]>();

    data.forEach((item) => {
      allChannelIds.push(...item.channelIds);
      countryMap.set(item.countryCode, item.channelIds);
    });

    console.log(`\n✅ 통합할 채널: ${allChannelIds.length}개`);
    console.log(`📊 국가별 분포: ${data.length}개국\n`);

    // rankings route 파일 읽기
    const routePath = join(process.cwd(), "app/api/rankings/route.ts");
    let routeContent = readFileSync(routePath, "utf-8");

    // 기존 channelIds 배열 찾기
    const channelIdsMatch = routeContent.match(
      /const channelIds = \[([\s\S]*?)\];/
    );

    if (channelIdsMatch) {
      // 새로운 채널 ID 목록 생성 (중복 제거)
      const uniqueIds = [...new Set(allChannelIds)];
      
      const newChannelIds = `const channelIds = [\n        // 기존 채널\n        "UC-lHJZR3Gqxm24_Vd_AJ5Yw", // PewDiePie\n        "UCX6OQ3DkcsbYNE6H8uQQuVA", // MrBeast\n        "UCBJycsmduvYEL83R_U4JriQ", // Marshmello\n        "UCJ0-Ot-VpW0uHJtZlo07ZtQ", // Cocomelon\n        "UCYfdidRxbB8Qhf0Nx7ioOYw", // Kids Diana Show\n        "UCXuqSBlHAE6Xw-yeJA0Tunw", // Linus Tech Tips\n        "UCqVDpXKJQqrkn9NMynQiqkw", // SET India\n        "UCq-Fj5jknLsUf-MWSy4_brA", // T-Series\n        "UCyn-K7rZLXjGl7VXGweIlcA", // 백종원의 요리비책\n        "UCSFYySyBYZuSVn4sSMZB_5Q", // 핫소스\n        "UCcXNw55zdRZJQgGCuhfMhRQ", // 한국 채널\n        // 국가별 수집 채널 (${uniqueIds.length}개)\n${uniqueIds.map(id => `        "${id}"`).join(",\n")}\n      ];`;

      // 기존 배열 교체
      routeContent = routeContent.replace(
        /const channelIds = \[[\s\S]*?\];/,
        newChannelIds
      );

      // 국가 분류 로직 업데이트
      const countryMappingCode = `
          // 국가별 채널 ID 매핑 (자동 생성)
          const countryChannelMap = new Map<string, string[]>();${Array.from(countryMap.entries())
            .map(([code, ids]) => `\n          countryChannelMap.set("${code}", [${ids.map(id => `"${id}"`).join(", ")}]);`)
            .join("")}
          
          // 국가 분류
          let countryCode = snippet.country || "US";
          
          // 국가별 채널 ID로 분류
          for (const [code, ids] of countryChannelMap.entries()) {
            if (ids.includes(item.id)) {
              countryCode = code;
              break;
            }
          }
          
          // 한국 채널 ID 목록 (기존)
          const koreanChannelIds = [
            "UCyn-K7rZLXjGl7VXGweIlcA", "UCSFYySyBYZuSVn4sSMZB_5Q", "UCcXNw55zdRZJQgGCuhfMhRQ",
            "UCOH52Yqq4-rdLvpt2Unsqsw", "UCcC0Vg-luhmJErWbFmAtudQ", "UCWRb5QmwOrsxewLmLwAjrtA",
            "UCXB0UOASLMQiXBv-q0H-eow", "UCfpaSruWW3S4dibonKXENjA", "UCXkRFUruW9lg4hEBILMVkPQ",
            "UCh8gHdtzO2tXd593_bjErWg", "UCyG7zAV_2JlPnxhwDxZN6sA", "UCgJ0-khC7vDOCuBMGquwPdg",
            "UClHbjVXWB1rCNfB-MQDw-Nw", "UCZvmd8vkAM_oMC_f90vWfag", "UCcChdZCHrZX7KH_65oRgKeA",
            "UCHoX7CztP2HlWACVVEtkv-w", "UCg-p3lQIqmhh7gHpyaOmOiQ", "UC7ynjArlSFuXW23ssZAknyA",
            "UCUBrgjvMxK2OAMVhbwdeARA", "UCc7o0OkR2BDFN4TCgPChjEw", "UCOU2PEQuXiz4JsfEtW3frhA",
            "UCrAhzG4rf642oTUCpdyo5Vw", "UCaoqDZPllYXLAH_5OBRLLrw", "UCXGXTy_GDJAlRTk9ypTHNKQ",
            "UC7e5oAresWJW6LOyygdSUXw", "UCHhHthKmdBnpB5uwSW6h18g", "UC3Tjj344taq3njy4yaK8ZWw",
            "UCyje3jvepx1bolRDjZYsF2g", "UCsIAfWi3uxjnQPpdvBgBI4Q", "UCYgA4AOMCmg6vepDmkcOEgA",
            "UCvuwlY4fWkWMuzRkj5MAK9Q", "UCh0SoBL5L5bEz3Hk-mQ3DkQ", "UC8N0_kO0ja3J0pbJGqvyfDQ",
            "UCN8CPzwkYiDVLZlgD4JQgJQ", "UCRkBBXlng9x1PBS4bZs9oZg", "UCK8lLbMbQdg_hjRLNBLDBBw",
            "UCSknObj2PGGK6KCkTyc5Kkw", "UCwTg-6vuMNVKQYX-TgSiC8A", "UCLIXIGgKraFxoU33arhDVTw",
            "UCX_mFmJj-ZZnes61r46SoZA", "UCRSEOIfPNgUYY8xkEzxqfVg", "UClRNDVO8093rmRTtLe4GEPw",
            "UCU1ddYi4dCO4d1k7mNOEg1w", "UCM9_aELZAI6ZqbBhmIjzh-Q", "UCpQu57KgT7gOoLCAu3FFQsA",
            "UChhOtjq-3QyyLmP2jv9amrg", "UChX-Cgkfava-G-LlfwC9v_g", "UCIwKf4XUCRzVRmg3HKpCFbQ",
            "UCjnq13siq2C1HatKjVatAZw", "UCjO3ji06DxmTM1RrzLVwmkA", "UCiEEF51uRAeZeCo8CJFhGWw",
            "UCLAcytNR3gdw44yzoSiKluA", "UCR-L8oZkHzgDh1ahJhH2WDQ", "UCn5Fol5NEcyotSwqrxsedtA",
            "UCQ2DWm5Md16Dc3xRwwhVE7Q", "UCFfYg0ARElS5naUXXECoNbw", "UC5NWh8jwVkWNmr-eP2gKPTA",
            "UCVWr5QkOkYupX6fEELMNvuQ"
          ];
          
          if (koreanChannelIds.includes(item.id)) {
            countryCode = "KR";
          } else if (item.id.includes("India") || item.id === "UCqVDpXKJQqrkn9NMynQiqkw" || item.id === "UCq-Fj5jknLsUf-MWSy4_brA") {
            countryCode = "IN";
          } else if (item.id === "UC-lHJZR3Gqxm24_Vd_AJ5Yw") {
            countryCode = "SE"; // PewDiePie는 스웨덴
          } else if (!snippet.country) {
            // country가 없으면 기본값 US
            countryCode = "US";
          }`;

      // 기존 국가 분류 로직 교체
      const countryClassificationMatch = routeContent.match(
        /\/\/ 국가별 분류[\s\S]*?countryCode = "US";/
      );

      if (countryClassificationMatch) {
        routeContent = routeContent.replace(
          /\/\/ 국가별 분류[\s\S]*?countryCode = "US";/,
          countryMappingCode.trim()
        );
      }

      // 파일 저장
      writeFileSync(routePath, routeContent, "utf-8");

      console.log("✅ rankings route에 채널 통합 완료!");
      console.log(`📊 총 ${uniqueIds.length}개 채널 ID 추가됨`);
    } else {
      console.error("❌ channelIds 배열을 찾을 수 없습니다.");
    }
  } catch (error) {
    console.error("❌ 오류:", error);
    process.exit(1);
  }
}

integrateChannels();



