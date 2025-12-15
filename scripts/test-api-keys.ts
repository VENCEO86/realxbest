/**
 * API 키 테스트 스크립트
 */

const YOUTUBE_API_KEYS = (
  process.env.YOUTUBE_API_KEYS || 
  process.env.YOUTUBE_API_KEY || 
  ""
).split(",").map(key => key.trim()).filter(key => key.length > 0);

async function testApiKey(apiKey: string, index: number) {
  console.log(`\n🔑 API 키 ${index + 1} 테스트 중: ${apiKey.substring(0, 20)}...`);
  
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=korean&type=channel&maxResults=1&key=${apiKey}`
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ 정상 작동 (결과: ${data.items?.length || 0}개)`);
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      const reason = errorData.error?.errors?.[0]?.reason || "unknown";
      const message = errorData.error?.message || "Unknown error";
      
      if (reason === "quotaExceeded") {
        console.log(`  ⚠️ 할당량 소진: ${message}`);
      } else if (reason === "keyInvalid") {
        console.log(`  ❌ 유효하지 않은 키: ${message}`);
      } else {
        console.log(`  ❌ 오류 (${reason}): ${message}`);
      }
      return false;
    }
  } catch (error: any) {
    console.log(`  ❌ 네트워크 오류: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("🧪 YouTube API 키 테스트 시작...\n");
  console.log(`총 ${YOUTUBE_API_KEYS.length}개 API 키 확인\n`);
  
  if (YOUTUBE_API_KEYS.length === 0) {
    console.error("❌ API 키가 설정되지 않았습니다.");
    process.exit(1);
  }
  
  let workingKeys = 0;
  for (let i = 0; i < YOUTUBE_API_KEYS.length; i++) {
    const isWorking = await testApiKey(YOUTUBE_API_KEYS[i], i);
    if (isWorking) workingKeys++;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n📊 결과:`);
  console.log(`  총 키: ${YOUTUBE_API_KEYS.length}개`);
  console.log(`  작동 중: ${workingKeys}개`);
  console.log(`  문제 있음: ${YOUTUBE_API_KEYS.length - workingKeys}개`);
  
  if (workingKeys === 0) {
    console.log(`\n⚠️ 모든 API 키가 작동하지 않습니다.`);
    console.log(`   - 할당량이 소진되었거나`);
    console.log(`   - 키가 유효하지 않을 수 있습니다.`);
    console.log(`\n💡 해결 방법:`);
    console.log(`   1. Google Cloud Console에서 할당량 확인`);
    console.log(`   2. 새로운 API 키 생성`);
    console.log(`   3. 할당량 증가 요청`);
  }
}

main().catch(console.error);

