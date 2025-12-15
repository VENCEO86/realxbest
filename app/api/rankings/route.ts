import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 환경 변수에서 API 키 가져오기 (다중 키 지원)
const YOUTUBE_API_KEYS_STR = process.env.YOUTUBE_API_KEYS || process.env.YOUTUBE_API_KEY || "AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY";
const YOUTUBE_API_KEYS = YOUTUBE_API_KEYS_STR.split(',').map(key => key.trim()).filter(key => key.length > 0);
const YOUTUBE_API_KEY = YOUTUBE_API_KEYS[0]; // 기본값 (하위 호환성)

let currentKeyIndex = 0;
const keyUsageCount = new Map<string, number>();
const exhaustedKeys = new Set<string>();

/**
 * 다음 사용 가능한 API 키 가져오기 (순환, 쿼터 소진 키 제외)
 */
function getNextApiKey(): string {
  const availableKeys = YOUTUBE_API_KEYS.filter(key => !exhaustedKeys.has(key));
  
  if (availableKeys.length === 0) {
    throw new Error("모든 API 키의 쿼터가 소진되었습니다.");
  }
  
  const key = availableKeys[currentKeyIndex % availableKeys.length];
  currentKeyIndex++;
  keyUsageCount.set(key, (keyUsageCount.get(key) || 0) + 1);
  
  return key;
}

/**
 * API 키를 소진된 것으로 표시
 */
function markKeyExhausted(apiKey: string) {
  exhaustedKeys.add(apiKey);
  // API 키 소진 로그 제거 (성능 최적화)
}

export const dynamic = 'force-dynamic';

// 간단한 메모리 캐시
const rankingsCache = new Map<string, { data: any; timestamp: number }>();
const RANKINGS_CACHE_TTL = 10 * 60 * 1000; // 10분 (캐시 시간 증가로 성능 향상)

export async function GET(request: NextRequest) {
  // 캐시 키 생성
  const cacheKey = request.nextUrl.toString();
  const cached = rankingsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < RANKINGS_CACHE_TTL) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        },
      });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const country = searchParams.get("country");
    const sortBy = searchParams.get("sortBy") || "subscribers";
    const period = searchParams.get("period") || "weekly";
    const page = parseInt(searchParams.get("page") || "1");
    
    // limit 설정: 페이지네이션을 위해 200개씩 고정 (데이터 부족 시 조정)
    const requestedLimit = parseInt(searchParams.get("limit") || "200");
    // 데이터가 적을 수 있으므로 최소값 완화 (100개 이상이면 200개, 아니면 가능한 만큼)
    const limit = Math.min(Math.max(requestedLimit, 100), 500); // 최소 100개, 최대 500개
    const skip = (page - 1) * limit;

    // 실제 YouTube API 데이터 가져오기 (데이터베이스가 없을 때)
    const getYouTubeAPIData = async () => {
      if (YOUTUBE_API_KEYS.length === 0) {
        // API 키가 없으면 Mock 데이터 반환
        return await getMockData();
      }

      // 실제 인기 채널 ID 목록 (60개 이상, YouTube Search API로 수집)
      // 중복 제거를 위해 Set 사용
      const channelIdsSet = new Set<string>([
        // 기존 채널
        "UC-lHJZR3Gqxm24_Vd_AJ5Yw", // PewDiePie
        "UCX6OQ3DkcsbYNE6H8uQQuVA", // MrBeast
        "UCBJycsmduvYEL83R_U4JriQ", // Marshmello
        "UCJ0-Ot-VpW0uHJtZlo07ZtQ", // Cocomelon
        "UCYfdidRxbB8Qhf0Nx7ioOYw", // Kids Diana Show
        "UCXuqSBlHAE6Xw-yeJA0Tunw", // Linus Tech Tips
        "UCqVDpXKJQqrkn9NMynQiqkw", // SET India
        "UCq-Fj5jknLsUf-MWSy4_brA", // T-Series
        "UCyn-K7rZLXjGl7VXGweIlcA", // 백종원의 요리비책
        "UCSFYySyBYZuSVn4sSMZB_5Q", // 핫소스
        "UCcXNw55zdRZJQgGCuhfMhRQ", // 한국 채널
        // 국가별 수집 채널 (2124개)
        "UC6XUug9NifWGWcL86YYeYSA",
        "UCfpaSruWW3S4dibonKXENjA",
        "UCuK80YHBZyyKrr2B1oHrgrw",
        "UCzhWBbuill_QyCG2W1M1iaQ",
        "UCY1kMZp36IQSyNx_9h4mpCg",
        "UC9k1vn9ErCoe7JngU6SubVw",
        "UCVV9-BZ_8EybNWtbvnF8DHw",
        "UCC6TthHceFnoys-ZDT8svTQ",
        "UC1LWEy4e4tudhEzMwjpBdsw",
        "UCCZ-gBdN59pF39tbm16xvdQ",
        "UC-Jp4WHCXhxvWQ5Ab4JibJQ",
        "UC_pT_Iz6XjuM-eMTlXghdfw",
        "UCTxEJoeukRCeE3j74tZjrAA",
        "UCkgDHJNdiidw67LAAVooc1A",
        "UCYfbq37VGb-07tDS0FGtsPw",
        "UCVzLLZkDuFGAE2BGdBuBNBg",
        "UCpVm7bg6pXKo1Pr6k5kxG9A",
        "UCDwzLWgGft47xQ30u-vjsrg",
        "UCx27Pkk8plpiosF14qXq-VA",
        "UCAuUUnT6oDeKwE6v1NGQxug",
        "UCgM5P6QGHmrvu5fDPx79mug",
        "UCXw1ddyrUmib3zmCmvSI1ow",
        "UCx6h-dWzJ5NpAlja1YsApdg",
        "UC_zEzzq54Rm0iy7lmmZbCIg",
        "UCQANb2YPwAtK-IQJrLaaUFw",
        "UC2fsxQr6Hcx1enORxXgKpxQ",
        "UCvrOll07bwpNzGhBHRB5_yw",
        "UCNnwmqZOxSuOiF3_c7mAGWA",
        "UC_JJ_NhRqPKcIOj5Ko3W_3w",
        "UCMupe3fvv1-Hi3SRxZzSsTw",
        "UCLNrdUoW2HhoN__dpRd585w",
        "UCHpGooMnVgnILywqrpqvZcQ",
        "UCVHZoKQu9Blud8PafEuMGXg",
        "UC_Cprc-ruVm1GS0yPvqy14w",
        "UCibo107UgpabxGBxEa6ixqA",
        "UCkertRH22emvpswtwcXdOxQ",
        "UCU4AAbkc32kiyHfHbxqKZdw",
        "UCu5FbwzTQGycs_lWChSOwoA",
        "UCmVvOmNXzC3ZL-p07JeEKcw",
        "UCP2yTuRy2rpr_5SmsgORNQA",
        "UCq4LIfDiEHlD6Q3xxYoXvJw",
        "UC5KviVfpd5mc_kHXpFhyJUQ",
        "UCIwSHyGTwA18EBS0sfRbi-g",
        "UCe6eisvsctSPvBhmincn6kA",
        "UC2hwwXiVc9v3F_U-kGQGcUw",
        "UCcrpFRRYkH185Xb8D-JQT7Q",
        "UC0JJtK3m8pwy6rVgnBz47Rw",
        "UCONd1SNf3_QqjzjCVsURNuA",
        "UCHUZl8Y-Kc16T6fV_KDpKGQ",
        "UCfpCQ89W9wjkHc8J_6eTbBg",
        "UCMl6pPuV-d12pbgV5Ugugjw",
        "UCQZqallfmfjyIQUjDwZAAzg",
        "UCbAlVnKhbGLK78GsSemQXxw",
        "UCu2D8oEJ34Z6XyS82ruupmw",
        "UCOdKaYgvLlPuinUJ1z5Gm2g",
        "UCBFs9KDo_f6T8Ro3wxvwnJQ",
        "UCLxAS02eWvfZK4icRNzWD_g",
        "UC9HvSOvNpFpjydzDkAQJCNw",
        "UCtU2-cpxx18iQ4BvracrxDQ",
        "UCK461o-vJ5o5VZ9Kvm1giDg",
        "UC4ijq8Cg-8zQKx8OH12dUSw",
        "UC-AQKm7HUNMmxjdS371MSwg",
        "UC8B7YycFMFQr540MK7Qe0CQ",
        "UCoC47do520os_4DBMEFGg4A",
        "UCRXJaBvhynZMqVCbHVkzkNw",
        "UC3D_rVuy7NliNQ95e6dCxow",
        "UCX6OQ3DkcsbYNE6H8uQQuVA",
        "UCtGbExCzlwmsyWKpxLnyEww",
        "UCuFFtHWoLl5fauMMD5Ww2jA",
        "UCdkRHUK23hW7Z8woZOLKtsA",
        "UCK8qVjkRMI1lRcYp6_W_1qw",
        "UCG_ZH242vja7O_rsxKMB-bw",
        "UCN5_WsFn-djS1r2Dl6e0seA",
        "UCzyN6CC8DbTtEgjr5mAsGvg",
        "UCOnCNCL44c3aWzhEhyQz09A",
        "UCxF3OOt7mSHSWRleJ8g8iFA",
        "UCrH-ZP24Fe4fp6caIETi7sg",
        "UCKBoJpqzOCqdIDUI3Bpg4Hg",
        "UCKs7gT8rAcPllB_H8dkVs1w",
        "UCFdWUBEzeNEYp1SHMmYUkIA",
        "UCUGbWDYeIQsCy6Hdcsgmq0w",
        "UCyvEONnqE2Krm9Zi0LVvGmA",
        "UChojGgtJd_Rlj4sqkiSIpPA",
        "UCPwOPM0PbkY0S1V_OqA-xjg",
        "UCjjSkTGJryh57LInton6lBQ",
        "UCN4R4RBWm6zXMOu8oTCxf1g",
        "UCBUtr557q58C-m0rWSVrRUA",
        "UCTqyHrlBniR3WWQIxjD5J8g",
        "UC_HuTtDholwrt2jBHvg5gwQ",
        "UCGbtVlo0NpJEflS1_OPiEtQ",
        "UCqmrtFyHzNwmkSdnd-GPCiQ",
        "UCKRRhX2D8RnUvWo6DgCgpVA",
        "UCv05TZY1vmsP2v7atrGpTfw",
        "UCMKiEAHkOTaqvy68nduSkTQ",
        "UCDYetMc6gOLkhIiNzFyrJPA",
        "UCicv75Se8iS6otnQJ_4Pa_A",
        "UCe1hlvtryjtpNL7b0C3c_iA",
        "UCvHRfEKlMPiebqNarQynRPQ",
        "UCL0bN6THhHVBwRPsXKOhAHg",
        "UC8id8PPmTd6aqfpUnQzUaxw",
        "UCbdpQVwM6iyAe2VpAnFTBxw",
        "UCNbwAysZuJmp15FE67O_9qA",
        "UCcUcfEwyDXBMsvYfoOdK7SA",
        "UCHAHRlgflciksI_DVB58C4g",
        "UCmh5gdwCx6lN7gEC20leNVA",
        "UCwVg9btOceLQuNCdoQk9CXg",
        "UCQ-l7aassFQZnFDny-1aRhA",
        "UC8JLtamR2_3vRYqDkgIQ1eQ",
        "UClWD8su9Sk6GzZDwy9zs3_w",
        "UCEYLdM2bdhmw-TS3c0TjFNw",
        "UCKyU-wd-KY4PMOcOpPQgQcw",
        "UCamdvUq4-BoneYsHZt0Agrw",
        "UCYHnYO50VV8SzsmQq5PChRA",
        "UCg3gzldyhCHJjY7AWWTNPPA",
        "UC5BJDVr4m9QEzQlvy_mKGsA",
        "UCtPrkXdtCM5DACLufB9jbsA",
        "UCAM2fyCjEdROyELretVTiiw",
        "UCsBoKLgnZSL0mI7C6tk0CjQ",
        "UChpxj8crPj8pdYQMOzaTgeg",
        "UC-U7jRRifYpmsflQibd7k0A",
        "UC580DuA3ghtZZkjnLh2TIEQ",
        "UC3mPKT3KX9ysgEqgUrCM9ZQ",
        "UCU_ziJAO81YhJZ77xor4vfw",
        "UC13wolbi9fA65ENzPye128w",
        "UCFrpmQLyAdTssO8CTuE4VSQ",
        "UCEL83AUr-SB29Z2UqWi8cGw",
        "UChf_AqFgcaj4s_WM9R1VhpQ",
        "UCdBiVWf2rT6pjn0R2uUWi6w",
        "UCux2-yFG8iEnTMexVeSsgXA",
        "UC4hYGez5Qn40KKmPLWhjraw",
        "UCfcN-XHBfAreS-hHbhvCfhQ",
        "UCOpRwrHA7yYdQbonYkQ436g",
        "UCkYVerz4P_kAZNbDdg2SAeg",
        "UC1yXC_D3x3u9vIQKngL356w",
        "UCBINYCmwE29fBXCpUI8DgTA",
        "UCyEd6QBSgat5kkC6svyjudA",
        "UCZ9lCUhUOUrwqVJmfBkN92A",
        "UCt3mMVAyGhwQb_ZBGp_p85g",
        "UCaYGWwdIj4xuDIW5vOzr8Nw",
        "UComwL29zYKujb1JhkB0EcGA",
        "UCkhxWF5CTMUgxneqAFP96LQ",
        "UCHYC82sO4Vpbdp_G2LZfIUA",
        "UCR9Gcq0CMm6YgTzsDxAxjOQ",
        "UC2Uioh1tYQkNuHLSBpzdfCg",
        "UCF2ltLX1dnPa6-L1paPaMzw",
        "UC9h8BDcXwkhZtnqoQJ7PggA",
        "UCnQC_G5Xsjhp9fEJKuIcrSw",
        "UCR1D15p_vdP3HkrH8wgjQRw",
        "UCb7fZdCnbt3AqnjgoNyT6UQ",
        "UC-CBQChrXvLzYc9oxpMfFPg",
        "UC7aE3x6TKbWLjngju6KdGnQ",
        "UClp6eumhT0_zbFAbQTwMNow",
        "UCZ1eCrCHm7IGNMPx2g_Wo2Q",
        "UCFMiVtfM4eWhPOMrMWrowtA",
        "UC9TyctkYTsRUmCX138l6Dug",
        "UCAG2n6_aj7v23Vrk7-h5Ocw",
        "UC-Z7UeLrYK3LG41dK6w5Y6g",
        "UCVEeHdpCjzcffcROCdRrVQA",
        "UCGi18LVfXgTJC5mslXq88KA",
        "UCPkR6At4SGY-zvhAMrFBExQ",
        "UCfs_kJf9EeyC-e2QN2q8eUQ",
        "UCg40i9L7DIy8FTPdttL_Lxw",
        "UC2QzIF-C2uTmKWGEEy6DFTg",
        "UCvKyQnhB5gvaMnEYf64BIYA",
        "UCzYy2DMdRgELLGAJI12_gWw",
        "UCBcW1jAsEnkjq9gQ7tuOhsQ",
        "UC5z51_WDY79adLDoOGXkxKA",
        "UC7kOE9iMTktsW0ScqlX1ySQ",
        "UCpT5HSYOxNtCU1PDa05h_fQ",
        "UCBnbnH7DGXT9yBBVFbZeIwQ",
        "UC1j2bFSKKhyl1h3IB05A-hg",
        "UCGAmpBtWveYp0-3v9npnhvQ",
        "UCGaY-T4e806HmdHzlXEcP7A",
        "UCsWHNWy_IVdlW0dx9hFTKeA",
        "UCmFLlkYNixVhaXSppSKvJCg",
        "UCaY_-ksFSQtTGk0y1HA_3YQ",
        "UCV4pE4z7qVEwkxbmqT36gdA",
        "UCAolsolgHiURrQBuZ4qe0lg",
        "UCUFwMzo2iqtCitBBVzLYjZw",
        "UCCrA8ZN1J3S52wuF4vthZFQ",
        "UCbA95m5GwqpTy2imbdriKoA",
        "UCTqb7oZzCYpzOhPenq6AOyQ",
        "UC8EdTmyUaFIfZvVttJ9lgIA",
        "UC2-zLDHEP2rEkqwgutb2ctA",
        "UCWVBfvVTf3UrPA-z5gos60w",
        "UCqDZJlfBGMSq88qjipRQMGg",
        "UCSJ4gkVC6NrvII8umztf0Ow",
        "UCucot-Zp428OwkyRm2I7v2Q",
        "UCs_ineLBnNTGjrArNzjSLZg",
        "UCVrK_pMRp_q8IelpfUCTGLQ",
        "UCwaNuezahYT3BOjfXsne2mg",
        "UCnSWkrRWNQWNhDusoWr_HXQ",
        "UCBElRVEL-H0eDYdL2mb1Sng",
        "UCUcy82tGagXlj4t1p2todeQ",
        "UC875v6TOQR-sLyED-jfZp7g",
        "UCKTHHyXugRBZQHG4n1nLpcg",
        "UCTXNz3gjAypWp3EhlIATEJQ",
        "UCpOAcjJNAp0Y0fhznRrXIJQ",
        "UCaVaCaiG6qRzDiJDuEGKOhQ",
        "UCoTmO7BjkCBRfcg0heLJoGA",
        "UCLFjv-Saz8b2_01asg9IQ-w",
        "UCaHJTioQFL0QjT-fxLudIXA",
        "UCc3Z8yEY-BMFDi9OktYnZZw",
        "UC5V3Ol8HtEXc-v0TaxNv-7w",
        "UCczkrFICr0xEgDsk51zZojA",
        "UC0sMuiy3fR1cTO_YbhA2o1Q",
        "UCnIn4o7pQO5bamsH-sN50AQ",
        "UC4hxr4lvd_C4ACiZTp55Kzw",
        "UC8t7S1o1dzvr9j1_idpVTSQ",
        "UCsf7o62bd1t0zy8csOPm1xg",
        "UCh_bnz4PJzcgCVvrRs98qqQ",
        "UCP8bmhXTdZXV_nr1jWen7aQ",
        "UC3SGtE1HWUj1JdhDJWEJW1A",
        "UCYydV0b9GawikL_L5b2yt-Q",
        "UCJg_jZ2_s-DuK8Fi17gSW-A",
        "UC7qgr9NTqrvNSQBSvycNEcA",
        "UCfRxPle_P_k3jyM9mypuiTA",
        "UCX2q5DXuYbaVYRdS4oucBtA",
        "UCaXa-12BiC7gHaggyMqa9IQ",
        "UC0QKe0NgW-b0oZvnB5vqiJw",
        "UCYLNGLIzMhRTi6ZOLjAPSmw",
        "UCLZLfy4DVTfpBpylslR_OPQ",
        "UCxuYPUdTZHRZKVRZ1km1plw",
        "UCT9zcQNlyht7fRlcjmflRSA",
        "UCzUjeR-Wgr0_iyL_brgx3Fw",
        "UCcgqSM4YEo5vVQpqwN-MaNw",
        "UCzrM_068Odho89mTRrrxqbA",
        "UCmBA_wu8xGg1OfOkfW13Q0Q",
        "UCqECaJ8Gagnn7YCbPEzWH6g",
        "UCStm2uvQKowSXrnCzTWAn6Q",
        "UCUT4NmGqjrVpKf2JyiS_bbA",
        "UCWepqrtrANMkbeoBMHxNbOg",
        "UC3--W-uc0yx77DO__lWJ05Q",
        "UCEc06N2Eht0eU4CH-zMNJwA",
        "UCs231K71Bnu5295_x0MB5Pg",
        "UCI5RY8G0ar-hLIaUJvx58Lw",
        "UCmibAd-n_BKSDiHfLrhEKpw",
        "UCxvgCfFc5QazfUs8QB6lg9w",
        "UCXtUpVdwm_2p5DE9DjfDQYA",
        "UC9w7aOZMl9a1l9boy4Y-xGg",
        "UCNxohbqfDp8YxW_Mji2XMHA",
        "UCGzRtagL4BHepvMzrJZTfZQ",
        "UC1bBjOZieJWHbsFA0LwjjJA",
        "UCpUuQKx3gP_iHQe2N9Mkmzg",
        "UCnxmrGXRbMeiKIqLX6L3Aqg",
        "UCi9_4jjovwadrSG6B5os64Q",
        "UCo5HJNjfdSoPWsdAHLsvSxQ",
        "UCp45ocV_A0ypI_iC2KuPnoA",
        "UCNIz8BSPZeJayWDiMYPk5lQ",
        "UC34HXkgbrIkIQ8IJtUSrPeA",
        "UCv3VVf9AQQVRNZhXAlB6ZuA",
        "UCWjgg6SMQiSQY8cUjCm2skg",
        "UCD2w1rGcJc99akNKluz_FDw",
        "UCLtNLP4wxWCVUv8bSgIfNvw",
        "UCEklbFbPoMaV1ciEb-0mAxg",
        "UCkKPG3RYxCGzrM-xdBH05kg",
        "UCdDk7KhjfoWy0EaOhO7tfNQ",
        "UCMD_RlHpqnAwSgPWdhPd37g",
        "UCMHQqhtbpxfcnPPYpryapHA",
        "UCyM7oro5NhR5oPyMEFB_rUA",
        "UCJI9kSwvvHX2CJeF8iZ6x8Q",
        "UCi1BNKbte8Pt8pOvKgDrsBw",
        "UCT2O1dUv8sBQqlCgo__KLKw",
        "UC_cOicIFgCXxo57Ew8GNXkg",
        "UCeA7OylgiS7bmFg00qk250Q",
        "UCMY6q2GjO4w61Olo27Z7c3g",
        "UCz1Li9JcQB9XP-HfgN0IYLQ",
        "UCkon1RijJ3-PgXKFaak8q7Q",
        "UCIOp9bFFZaZ3chNMaRtkU6A",
        "UCv3gzOEp3ToqlrnePbv_rrw",
        "UCUxioxgZ7obrP3wVJApAK1w",
        "UCA4VRT895OOPPHq-pc2V2CQ",
        "UC6p0TCY8JtOVzuH_TjSy4VQ",
        "UCg2iVGZWqGkzmcPNVm22PQA",
        "UCRHUXnfXJjjLd7RPmvdgzZA",
        "UCM9gZHS3PjZ8hV9smRqxdJA",
        "UC9lAXagRgsxfqh9Z_txkODA",
        "UCifzsFIiIf01IijUvEUK6Mw",
        "UCWLhN89W2maiH3VFHPYgtRw",
        "UCUxHKCQHQzDEDeM6GFPYCZA",
        "UC1asDkZQFURjnRK6ukfnCxw",
        "UCbp9MyKCTEww4CxEzc_Tp0Q",
        "UCNyv46EnCgc9hT7EWUXBuPg",
        "UCtpnpcN0iBupTk3MtWPzZrQ",
        "UCo4U0A8JvVDLCPRqQeRVW9w",
        "UCHJJtInB587rDX2YOWuxDvQ",
        "UCrcpJHAqTGIY6DXnFvo-F5Q",
        "UCC8FSfSnbjiZ6vGr68ZLtzg",
        "UC-uIpGINZDL-VIHQQzJW8jw",
        "UC2SpC8rL9LaeQriE4YNdyzA",
        "UCXqV4yoyC_mmZye6VbKFPeQ",
        "UCoUM-UJ7rirJYP8CQ0EIaHA",
        "UCPuEAY09CtdTzFNWuqVZgDw",
        "UCWBWgCD4oAqT3hUeq40SCUw",
        "UCsIAfWi3uxjnQPpdvBgBI4Q",
        "UCiZ-lRcGWAPRTZE1G88gTqQ",
        "UC-yzfnLJmz2vL1rOlb_AVGw",
        "UCyyZsD2CpZG9QBvdFX6Woww",
        "UCdCMfNU9hgmqSbrInxg6NYA",
        "UCMqjTrrtGPI6i_i5eM0CVTg",
        "UC60O6enNi0YWW_xBarUjsuQ",
        "UCgIDTl8dHcJAINZLmeGVBWg",
        "UCpemiRRn_jkIy0SWk_sUmcg",
        "UC-ZggGuzuZHO7N0dNRX8-Ww",
        "UCDP04M4qO7LIs-bvNNdxj7g",
        "UCWXLyHMwFf-ESe0XAtN3zSA",
        "UCtqo6CShC_pM8-5kDGsLGCg",
        "UCjv6S_-GwPwSVGHFZ5D1QTg",
        "UCeY_49I4_Qym_kziWri9VSw",
        "UCEg_iK8FKwZfpRMn4-AnnnQ",
        "UCRTAHXRbRuYlsSCmb_78d_Q",
        "UCc8o0cT4aD3n1Bw3k5GIdQQ",
        "UC4043jVyl39si8xvI99v5ww",
        "UCt8pTdOArdJnJfxsMbuLvHQ",
        "UC3W0QqNMVoMRF9StkgEP_7g",
        "UCLWCLAx6Gbs2J75Ts5IAiKA",
        "UCT-I1uZUgCFwnr3Xv-Fn09A",
        "UCNYi_zGmR519r5gYdOKLTjQ",
        "UCecAIXPb5KTJz5BFnUzlTaA",
        "UCZuPJZ2kGFdlbQu1qotZaHw",
        "UCCvcd0FYi58LwyTQP9LITpA",
        "UCsT0YIqwnpJCM-mx7-gSA4Q",
        "UCxU924xEBu5BcSGreC8Jnew",
        "UCWsDFcIhY2DBi3GB5uykGXA",
        "UC1DtEMePmr4O6F2do6BVl7A",
        "UCo2Fr8GUPmevyi7uih-0oTg",
        "UCcCBMngwpMdb1AmgtR_MlFQ",
        "UCifgDk-uWpEOdPty8zJDoUg",
        "UCeU8nhO6mGDvNGcq6iW_VFQ",
        "UC6GkkHjigCzoVgvtYg8UB9g",
        "UCxfvxnhRK7cclYoUHnTtoxA",
        "UCs5BUBxziPYEusMTvA-E8oQ",
        "UCwy3Pdzk6RMLtejVuz1tI6w",
        "UCmG1jau_S4TXKhDjAQoOfcg",
        "UC4FBA16OIE-cuHLATrdxJpA",
        "UCl1dO7OWJ2NwRpW0NOOIkLg",
        "UCQc_CdpwEWsND-LyskBJA_w",
        "UCnE6Zj2llVxcvL5I38B0Ceg",
        "UCJfKMFp7dtO8mpHT56X0kJQ",
        "UCwZjVanaSg019RVQea9V1kw",
        "UC1wJbI-Z0U24G-H_64SSNPg",
        "UC65eKEkrsE5FhkMQokXe0fg",
        "UCB8FBcA0zpLbww-Y0R7KEpg",
        "UC1Fvzs2pfUoOhHwRj2cTR_A",
        "UCb3zBdj2HbRQBR4-A4AQ91A",
        "UCAq08FPNKlO0KQWJxugd2Ag",
        "UCjUAWSquSIB4ej5Zdm189kw",
        "UCTUkEGO5oGrnKw7CeH5F_Dg",
        "UCEUZ5yPsOUyBgF7N3Agm4eQ",
        "UCZ8EhxaNHFIBLAnNzCprDiw",
        "UCjSNHH2i0Ve5YVYOUk1sGwg",
        "UCqJ5zFEED1hWs0KNQCQuYdQ",
        "UCaLcUNyzcNwaUxMYMQfcb5w",
        "UCCm3xDalujG8RHrhdTAZlgg",
        "UC7-EJtnI9Zdr6wBM4vdhnfQ",
        "UCOQfu4KyKnC3Orfiw72asfA",
        "UCZyqbZKCQuqF5E1EAZhBVqg",
        "UCrd9nnfKqHtpB_Gyg8xBwaw",
        "UCro6i0DgLgVntjcHkvlmbzQ",
        "UCKAB3SSR5WnYA_VuDCX5AVQ",
        "UCcAd5Np7fO8SeejB1FVKcYw",
        "UCIsSPTBMJXYL-JtVAr1DcFg",
        "UC_IeD6kn9O0vBMQ7Al-zCTQ",
        "UC4gNHCugaKSSCpaI2hL2Jmg",
        "UCR_ZsBc0Jkj47y51b08N3Sg",
        "UC03jIQv4WXBSHdr1DlCLYDw",
        "UClU87dJnn_5PQLTRNqPdsmQ",
        "UCWHUr9VWqdBMHKrDK9HkqsA",
        "UCzTtOp9QPHQUghlBPdfl45w",
        "UCdaSDApIZr2kefWpAFFNJLg",
        "UCrH7fzFL4Vevhf-uM5yl9Dw",
        "UCDpbu49__W6By7fWDdv8_eQ",
        "UCpLdxeOF7xBtUAZnyomd60g",
        "UCXjO5Ybiuj0KYUmfn6h_Fnw",
        "UC0XOJ92UN0eWVtthtopY0Jg",
        "UClW0fj9EUgFLLeQuoRlU7ww",
        "UCEUOUnri3MoSJ2ulPko6SvA",
        "UCeoAwDck_IgaAll_kh6Jxwg",
        "UCTw0MS49m81D-vEnjICDMMQ",
        "UCDqzSdZTX_pknvFmYRxKNrw",
        "UC7bObx-z__EsUvoYfYzeH8Q",
        "UC8qqE3HDiOp-Y96Zgr_ZfPQ",
        "UC1X8zajxMIFnA5om07sjEUw",
        "UCrL_oQsZTxxVcwBBrS1fVlw",
        "UCba1vMvOHWlMddLARS382Zw",
        "UCNvA5V-EApy0BCz7RfTM42g",
        "UCayET8_j1UZpC5Z1Kz3xVZw",
        "UCzFe9cWL6OUi141xZj1pzkA",
        "UCjNgqJ_FMLntYVzq7daw1TQ",
        "UC-elz6w4sbn_5LB37pJjTRA",
        "UC4Ge3cqrdyOszmnJTcMICcg",
        "UC0GbKJaeEN9k5CG1NLbN6Ow",
        "UCs1mvSRecoRjg2eO4zVGdiQ",
        "UCjkGXhZsu5H64fWuNQNf1Xw",
        "UCW39zufHfsuGgpLviKh297Q",
        "UCXKhedqbLt3Q8zZbq-E_i_Q",
        "UC-zNEWPxscw6kf15ilCf0bQ",
        "UCaUqep5GzPk7qoMwlbsD8PA",
        "UCx5ORNOfXUhp6yMw7pdIvNQ",
        "UClWWxUvcn1aE2RdHVuCtWtg",
        "UCXgG_pkslCJqivZLhWbOMLA",
        "UCCwRtme3lumNRQXMO2EvCvw",
        "UCUDH9jD2SblfK5vBQOVgrhg",
        "UCcu3TwVpUX03Kl_l6XKEdVQ",
        "UCoOFbKvk7COjkqB1dkpWD7w",
        "UCN0933hpF_Gk3dVXhhOIrKw",
        "UCboxIdQsA8ldaflTtDPBa2Q",
        "UCfXVS_zw_XmAx8iIiia1IkA",
        "UCnw9gQ4gor8IzsXZ-dWIRxw",
        "UCWADesrJsGjg3S54v08u9LA",
        "UCO-3aqcvw3HwwY6lRGH58vw",
        "UC-PfOLRF-nGcjrnedeojCyg",
        "UCPCYlqd7uUYhVrt4HAKhAlg",
        "UCLvEK5IsuSZSErmoU1fOwog",
        "UCfs-zVPd3HlxGzFKtDXMLtQ",
        "UCaHEdZtk6k7SVP-umnzifmQ",
        "UCqo103ltx_rUXCqJhpoF1Qw",
        "UCvZSJLg7pjLHzAyMMJvtnmw",
        "UCIyoG811huQwaUzs90RDjdA",
        "UC510QYlOlKNyhy_zdQxnGYw",
        "UCl9E4Zxa8CVr2LBLD0_TaNg",
        "UCMXAvqLnxTBMtJY2CvQEhIg",
        "UCpMaCx6TBwewF0VrkfpnRYQ",
        "UC-lFSdBsycrdoBCtZDgWl7g",
        "UCB1dgN49EamWXE9b5vqCacg",
        "UCr3iNgIx1kj_bTrpbZxf9Yg",
        "UCJ1m9t6jxNWFX2SGnjd0JZg",
        "UChglvcqTc4vJvg5XMjP7jKA",
        "UCqEGGqUq-Y4GWg-rmTIojFQ",
        "UCM5MrzBythXcWWsCzbV8L6w",
        "UCNzYSiIjGSJHfrjBdScrgFw",
        "UCoduWHPK7TuZ4MthJG-ePLw",
        "UC8NNg2qEuMQIXlqPS-eu_ig",
        "UCODtgZ_rBnbuVmhV6FrKCpQ",
        "UCej_YhLi_ouFU37iYwdrrRQ",
        "UCib5FRq9RkYDp-CobPrDqXQ",
        "UClERISqb7PI74-1JEBQZnJg",
        "UCE7Wjaudpgje8fG6_Y4hecQ",
        "UCR2Q6LxXc6hFJvnwVIevM5w",
        "UCnHEz9DZ6EAof1-DaQGD_Xw",
        "UCIeuUT3mfhxreOMIls9fWew",
        "UCzI7wZyqk7jpXWT_MILjepw",
        "UCl8bYBm0XAP23mReE11IBOA",
        "UCMIBUhL2pb_wPFPoeJ5MWBA",
        "UC6Ij1c74Gm-TicYZsKL1FAw",
        "UCyV2fYyEnnRoQpPiNk492kA",
        "UCrp8aFu6VjkZAY9Hhj6IrXA",
        "UCf1XIplYiqNv9baGsFHwPPQ",
        "UCyhbIj3hB8y1oCDU4ZXZJZg",
        "UCGYYNGmyhZ_kwBF_lqqXdAQ",
        "UCDRlmWkAQ7GoCNjQIXGF5Xw",
        "UCDwH6vSy8P5-Sf3nngtOy6g",
        "UCJmkopWuQxI9U0NQaOcl68Q",
        "UC02TmBhCP2jYWm1MUCCWGFw",
        "UCP--bppOtrLPsVgtTgbaFpA",
        "UC55rQHID6J86rSvHJsGOHcg",
        "UCOLDeB-IybhEalRo_-C_Ojw",
        "UCKadCx-t_VmwzfWczlWE98w",
        "UCooJmlXCAkxVZu_VTY5lMsQ",
        "UCBTuUY99I5plMaC_ZcmXIYw",
        "UCrcS-SXuGnBTzBCOG8f_fsQ",
        "UC5Df2KZ0s2h8Klub7s7Oanw",
        "UCPHPu0J-6DDxyl9Fm83Z83Q",
        "UCzOB5P52Q49-hK_MdvMR7PQ",
        "UC2NMnJ9UuQxAGwwc8JhWg_A",
        "UCaIoV23UMZNifJ3G-djMU-Q",
        "UCNi0Sg6pkZyx6BtlKdI7GLA",
        "UC0MlKUARtHzBx9Ey_FbEO_w",
        "UCk8HxIbmutDtGazKmFwAY6g",
        "UC0pHpxSt_4gd63WylQL0cVQ",
        "UClQ3NafOy_42dJ0toK3QUKw",
        "UCPsMhcw7ZLRoEOnJleokzgQ",
        "UCrHYJnijlzv3lCLKl2eP0lQ",
        "UC11aHtNnc5bEPLI4jf6mnYg",
        "UCjrbyUPrmuSpm9m-acvABXQ",
        "UCIFk2uvCNcEmZ77g0ESKLcQ",
        "UCGttrUON87gWfU6dMWm1fcA",
        "UCQeRaTukNYft1_6AZPACnog",
        "UCo3OKK5cdUlytHgl3ehGVZA",
        "UCkoujZQZatbqy4KGcgjpVxQ",
        "UCtVDQNGBmS8DTP5fPzM_GmQ",
        "UCGX7nGXpz-CmO_Arg-cgJ7A",
        "UCgkwoH_xiJOutAj2zyu0Ucg",
        "UCTK-HeQsG6v8Fs0iaMiETvw",
        "UC5GC_zT8jdqbJIXsVOEDvPg",
        "UCiP4vgwRwY-p9zPA63AkQHg",
        "UCETKopbJ3g1KlZVAvaw7dUw",
        "UCwAxTfGsJrF2BpVox780i6Q",
        "UC0M8_jLEvD_g_f3U8xmk5ew",
        "UCpqNgxhtBcCk4mVIqz26W2w",
        "UCYeQP7gMalG2boEZe6j6qQg",
        "UCFK38lePM6zqQ2CYfQyqdHA",
        "UCu_HzIz_RhAT_vPcvdeCbuw",
        "UCYaKfA3AdTTGGqFy3YO4coQ",
        "UCirDBNsOzX-Y14wEEn7m3eg",
        "UCT0h-CKwYwth2AMwVogmZSA",
        "UC9UeTUzdZ2G90vG9FS5Xurg",
        "UChXi_PlJkRMPYFQBOJ3MpxA",
        "UCaVjrfFemt82ZMgw_vaBYGQ",
        "UCOyqzCvVplZGU00vuS49zcA",
        "UCeYiAaXw-aauILPI-jSVi8g",
        "UCKQ-xBLhj3SkN9Wz6MwjLaA",
        "UC4tjY2tTltEKePusozUxtSA",
        "UCyps-v4WNjWDnYRKmZ4BUGw",
        "UCBKjfVHvLdE2aQIVMWhy00A",
        "UCEQ9d8hoNFdWaOTxVuk8GoA",
        "UC73K7cmsHCLAlhiy2n69aNQ",
        "UC8XE-A49rEdZfEyIRAea1Ug",
        "UCmfwB8Dt91cOaZ4Hhyac5tw",
        "UCfQPeIIXEXyyVFLo0bmlmlw",
        "UC7hDgC7T6uJ6Q9Qk4NH-EXw",
        "UC0NcMsKpN9H3A9ugEouo6Iw",
        "UCieud0_0TZ3U5EMoY7sa-8A",
        "UCMDJ63wX58SCppmUKxH-R5Q",
        "UCoKDz01GQcsS1iuavemgrEg",
        "UCqXUG2Dw0M17_qxIsUPzMYQ",
        "UCnXPTtHj_qNL2idFPL_MJBw",
        "UCiLHDXgCNJM0xXtBCpfhCyg",
        "UCTwB2GAcdXyXuTTDawsItxA",
        "UCFcGxVIBPlx_l5eXfEl7jgw",
        "UCORibgWPO5FnbY-wEMvNNsg",
        "UCnIPAmj835YW2OUYBQIX7lw",
        "UCI5BkN1Dh7G8WquifrZLV1w",
        "UCwvq9q6O0UunlHmdPLKegDw",
        "UCu-9KBnwu8HAVh7zBtzrowg",
        "UCE1k2nRsQRu0HOC2JNm37EQ",
        "UCWn9ZeeCbDX-rvFO3jJK0Nw",
        "UC7MpM1FlnK-CgMTWvzzWDbw",
        "UCkFM59_sGwUQYaFtfW5Zymg",
        "UCTEFw9ewed8a05rdC91YmSQ",
        "UCFZNQoqbWeRNEYjHorJKGZA",
        "UC7iYwmnNjvHEOsB2Pz9_dcw",
        "UCcKdpPgQ1burw8sISn7YL4w",
        "UCn6fIWGYI30xGE5ouTB9rKg",
        "UCBYyPLhdJtXh-bGK-4DkYlA",
        "UC3DfvZzXwqHYLXFX4Yj2wvA",
        "UCj_i__0zAxLhE0WEf5X63pw",
        "UCv-M-lbmKT9pdO0WHOJq-aA",
        "UCFLGpR5H14SPIbtYbaR-T2w",
        "UCGF1RwmEFRiVAFaYwq_fqjA",
        "UCYICTODCUdIz6jqr141kI_w",
        "UCyf5YLGxk0qzOmJzEQqLoFg",
        "UCGvqQwMnH-ZyiNhw77bsh6w",
        "UCB1nRY5eW-on30ckq8XWFhg",
        "UCxkbb8f0TaYOhQ_dIWMSd-g",
        "UCh0L8fHZWyH6X6fvw8u-58Q",
        "UClFkkV5CRykTHutqYNXge_w",
        "UCcQsRCMv6jA3aFYaMWw43cg",
        "UCgx-6F4rB4M8yf0t90uExtg",
        "UCxquM2kRALNdiA4cdmaRNNA",
        "UC9KwRp1x-9PxT10fSLc-gYw",
        "UCqk4zMZPEvuhygJba2ZiseQ",
        "UC7W1dIq_osDBuqTIH93HSDw",
        "UCtwEGKUy2DEA5T0nhZHcwpg",
        "UCP-HlIuPQUyU0Ab5L-zPGWA",
        "UCU3zCEUECLVydgmbBidENLQ",
        "UCXecCJDFeCu6RaZ2P7xGKGg",
        "UCB61Wf7CqPvvaoH8-_1EBeQ",
        "UCGb-z0y5wn5oiJuTeF1Qvpw",
        "UCeeHT-3WejdX6uGBgCbE7SA",
        "UClOpS7PCqKYSZnOG8r9CIMA",
        "UCknLrEdhRCp1aegoMqRaCZg",
        "UCiLW00N3_Qe5yazpDk8xxjA",
        "UCnuMwZoIxPK-ilnemcMOUiQ",
        "UCUb3mdcrExe--za3R65fJnQ",
        "UCpIQI_HtJakX_lcyzRp7QuQ",
        "UCzKrJ5NSA9o7RHYRG12kHZw",
        "UCs33ZUq-3M7WPOyyRhgspeA",
        "UCWElrPODkWkHBti_PX6LSqw",
        "UCg9e9ny5cIIcj3NXHactp-g",
        "UC0gjNuGmsefdBzCotZk_31Q",
        "UCMyOj6fhvKFMjxUCp3b_3gA",
        "UCbxb2fqe9oNgglAoYqsYOtQ",
        "UCWT3U_yPEPKN0q9w0YMQHPw",
        "UCsXVk37bltHxD1rDPwtNM8Q",
        "UCfICLkXJnzcDDc3I7S6f9QA",
        "UC0BXuKeluFT72Ls5iQYs7fQ",
        "UC6huXz0F6-7KA7-mW0jdejA",
        "UCxIsefyl9g9A5SGWA4FvGIA",
        "UCdi8yQBdBfn1ECu3ayH_TnA",
        "UC9JXMJFzrQDtc2dNaUs3cZQ",
        "UC2bW_AY9BlbYLGJSXAbjS4Q",
        "UC0znI3dRWpNF8lvbPBTlzyw",
        "UCsSRxYAK0PiA7d0XUR6sPFA",
        "UCY0pZFBagHDdQ3LeUzb9IdA",
        "UCUaUAdqLGQWZR2wDc6BXknQ",
        "UCQuIaTv6Ik1yTlCOoTI5aLw",
        "UCUKHCqa-w6fNRLM0Gm3xFPw",
        "UCyhjGHZsr4VIFToqLah3uGg",
        "UCVEVEZvgKDrf-d6SqwykXUw",
        "UCeJaCa0nbDn6oJjtBrYmpaQ",
        "UCyPEQTHQ4h7eTk-zIkBpb6w",
        "UCNgSodJAFmvgy5ZhYFrQhiw",
        "UCbxCR9QT9YTuUa4ONm7zAaA",
        "UCedub201MgXhnYhzV_58LqQ",
        "UCrUsvEm3stQir_fCEfpYw-Q",
        "UCLZcxlLIOzCl4AUVV8ikCgQ",
        "UC8rKCy_tipwTEY3RdkNCKmw",
        "UCFhuQ228JMOO9A9TBAyRKqA",
        "UCjqWpJu7s0Zz0uVAJi4DLrA",
        "UCqL7h5SHWpwr2YNMc3odugQ",
        "UC2c0uXsQAM2kXnNcq0nFZPQ",
        "UCUH_JytZZfy9eaDTDD95Hnw",
        "UC9QIoBbnah7v7eDdYUeIOtA",
        "UCvZ1nxu2Kp1AuXew-iOr05Q",
        "UCGO51ouV5uqQp727bPJt7Ig",
        "UCBCpCqe_i6zozF1hCDeaImQ",
        "UC9lxS3HpQS-QT58NojCLaSQ",
        "UCxojsCfoOov281j58yaH45Q",
        "UChoQQRDf-zU1h6_YjKkWvdw",
        "UCOgGAfSUy5LvEyVS_LF5kdw",
        "UCC6M5UYVrIbtEZSi7hu5V8w",
        "UC16niRr50-MSBwiO3YDb3RA",
        "UCFHUP1pTq7mqrYUWyyICp-A",
        "UC7_VkIW7nhIurDTfy-lWPDg",
        "UCZffS3HZmQz18zuCWStcfSA",
        "UCzVb0SIXp9q9PeKCcFjsBtA",
        "UCIaFw5VBEK8qaW6nRpx_qnw",
        "UCDNC_wlI1WsFX8__VeGGuOg",
        "UCkcEQ9D5ZZybYbpI8Ufwhwg",
        "UC0W6urY_d3f25KtRvI2Mm7Q",
        "UChKWEfWJgBw_8GOP4v9qlcA",
        "UC37GQFg0UwYArV8HXhCdZtg",
        "UCWe3Zq_-Ln5oisoi3vPsL2Q",
        "UCiMwrqouFvv7WlxjeiWWGpw",
        "UCEPMVbUzImPl4p8k4LkGevA",
        "UCMAcO9Gfdw6JySKxSoBuPGg",
        "UCBRbxZM7CC_IvDmoLic7E-A",
        "UC9HocBPXanINU82K0nh6lAw",
        "UCi7DQdu8N8VKMMt0n-T1GeQ",
        "UCq0pVPNYdDWQk1iTS4jTk2w",
        "UCg-p3lQIqmhh7gHpyaOmOiQ",
        "UCWtnrgGpS2aL9hHblisTFiA",
        "UCDddzA1UQrtWW2jIVZumVxQ",
        "UCAajxL7P_DNhoXwOSOTyWAw",
        "UCDknDqUujsogqcqRfpTQgRw",
        "UC4saEsBS4If4BoX7sncxEfQ",
        "UCImGPdQRYjZlV_3tzNAgeXg",
        "UClWASiBZyqlxwwIClTMKzbg",
        "UCWg3Qei78aXxWv-jOpOyZPw",
        "UCmS-kf2JQARzvWG3H03yPUg",
        "UC6hHuewUawEoLN2iLNjXYmA",
        "UCJHhCwfd68pRiV-6T50roRA",
        "UC-tae0B7v1v_wHiLg84aTdw",
        "UCnU18TR_lXFqIIKUO7cYlgg",
        "UCWrD2VhZdO-_W8QDBxiXmeg",
        "UCG899lw826XRkRDx3wphtIg",
        "UCHcPqfkHN6NbWIK64HCw-Lg",
        "UCIJZA6SJ3JjvuOZgYPYOHnA",
        "UC99UVNiwxf-MNGnoHt0lJpg",
        "UCemhZ2At2lgifTJLClGCz9A",
        "UCAX7SvpaLzljO5n6fbTw9nQ",
        "UCABAQID2xmChxHzEDW_UbVw",
        "UCHJWF3nK_54JilwFJnXjrYQ",
        "UC0MGL-8ZUj8bB5rDdE4TXZQ",
        "UCvYPobTo42NM36X7VC4dLhA",
        "UCsw62CI1vi4NSCqk4R9rBuA",
        "UCMca7Q08z9aynM_Psi-MC2A",
        "UCK6TzBHhEUCKa6dgjlsVHEw",
        "UCtMXv7B9VCLPtFuXJk-ToTQ",
        "UCOmHUn--16B90oW2L6FRR3A",
        "UCM9wdMTld9eznLtoN3omCAw",
        "UCub5dBzD6H9Qc06ZJms9Ggg",
        "UCvz84_Q0BbvZThy75mbd-Dg",
        "UCypvWRN8Jo7mHHUPBe-Ow2w",
        "UC-F3kTU4V680v550AavEOsQ",
        "UCYzEMRKqrh01-tauv7MYyVQ",
        "UCJEWeccu2U9PN-ona1W-lRA",
        "UCh4o9ioiqbUveUrCLP8Wv6A",
        "UCXGXTy_GDJAlRTk9ypTHNKQ",
        "UCazoYcXP70mx3Sn7cpnC5qA",
        "UCzS6lx3_vtOx5t5SDm_NYTQ",
        "UCtpkkV6XId_ZAYM3HfPhHoA",
        "UCQfwfsi5VrQ8yKZ-UWmAEFg",
        "UCJldRgT_D7Am-ErRHQZ90uw",
        "UCCCPCZNChQdGa9EkATeye4g",
        "UCj6GmjJLkpM-o_RBJACi2bw",
        "UC4Tb9_0lCFmKwI6nCyz-UIA",
        "UC1tBMf8YNhavEMCxFG1BBWg",
        "UC-C43Eosv9Oywa_hpd9zCVw",
        "UCo3gXbvqj5heuu2zIT4lH7Q",
        "UCc0kHafEIzm6PiqyrsC5lyg",
        "UCNRRo-lro9ftQ08lUHdcZlA",
        "UC72_FRBE63kbHDYeKgc5HDg",
        "UCXI9sfiqYnA2HV_tm_CyBQg",
        "UC0Ize0RLIbGdH5x4wI45G-A",
        "UC-bbHiTZGWKbsCjpzUfrk6Q",
        "UCDogdKl7t7NHzQ95aEwkdMw",
        "UC0OjtqHqaKjetE-4oziYWug",
        "UCmxePybUpZj8RRuWz6r8uTQ",
        "UCisy6taOAeLfyaCqcMQDfig",
        "UCKCighIcgEl2I1n6Y1mF9Lg",
        "UCoN7jbN54AaJXj7TcFZikCw",
        "UC-_KiH_Z2yerhAD_cAjAMOA",
        "UCzY_sIOOHeCobumpqJrjdig",
        "UCbAwSkqJ1W_Eg7wr3cp5BUA",
        "UCpWnVA9ZxSXj8So2yZt6__w",
        "UCz0F9ndJTA0eL2XyL5R8YNg",
        "UCyVV_v2lWH87tlXyrRNWQnw",
        "UCUfXccH-ZyEQUcHEsrqw8UA",
        "UC_cPZBMk9Zv7ZiYrqxSDwHA",
        "UCYLaYXb6L5dLtLR86HV1Pgg",
        "UC2kF6qdHRTM_hDYfEmzkS9w",
        "UCNMVcviSGT6eqXOQIKO12bg",
        "UCQS_yq2qPdfs8LPRF3UjxIA",
        "UCa_-kM9SoahAJOWKnr0-f7w",
        "UCHQoSTQPhQC3WrLSB_XKVDA",
        "UC2i3SQm6aAsku9vWvBwQ5oA",
        "UCQB7te4G9CLytduw7NcfN5w",
        "UC4NeobsLv0Ibzd6jUXLjwxA",
        "UCfc5K3Hmliw2GI5ek94eKWw",
        "UCc1eMLEEHiwcgVn1JkaBCoA",
        "UCSSWXxLThJqU-a8gzSTCCZg",
        "UC7RCAzma8Gotzqmu2y-3Dnw",
        "UCXsYq7TeUBruQsG-su4_rOw",
        "UCpXwMqnXfJzazKS5fJ8nrVw",
        "UC8fwExOkHg0_fX_XJcR31NA",
        "UCEjIjshJ8bvvCkGNk0pkYcA",
        "UCFX0lAkJUQwRP19Oi4BN6bA",
        "UCUCmKmDOuH1ETqRYfTQrJSg",
        "UC69Z5Vd-Z6bdCC5LKM_lv_g",
        "UCLrB4AoV9Lo_aAY5eNJ0QXw",
        "UCKgpamMlm872zkGDcBJHYDg",
        "UCkj8f9sqSKuzn-NyP7Os1ZQ",
        "UCKA_0KjMtWLk801XpgHjyuw",
        "UChLN0bJgq6d15OK2HVB4YTg",
        "UCGRryxFxjXbVAtBPE9EbyMg",
        "UCzgxx_DM2Dcb9Y1spb9mUJA",
        "UC0QXWw0OiMnagIhdBn_fVPg",
        "UCggBc5kNSAH4kFKkrYBzddQ",
        "UCGBDNMouiWOCVTP1Ae5xS5w",
        "UCNSnD3hisFi3AQCtwomG8Qw",
        "UCDLBQD55lbHb6hhdtyky8fA",
        "UCYwakeGyGy7Z1S5cRbbDZrg",
        "UCwfT8QeIiEaNmCIyOT4drJg",
        "UCb9rZV2WDEtlVaWUZrieXoA",
        "UCi0yATR3GeUGHi8zDSzKGZQ",
        "UCrNQXOYSpV2sCAz_jV-YwLA",
        "UCSYnl45nK0V_z1IySmTgp9A",
        "UCpbtQ_-hn6DSh9KqKtPfEwA",
        "UCqnf10Ahv8qWNxItHXokfCw",
        "UCz-ukqrTSDRT9YXWdrXoVKA",
        "UCHf1sFInq929uJTIjUhh8pQ",
        "UCYiaHzwtsww6phfxwUtZv8w",
        "UCQxiko3707OV9Per6Eqwm2g",
        "UCvjJzc-UcTv2P5LR6NGP2lg",
        "UC56D-IHcUvLVFTX_8NpQMXg",
        "UC7RNjS5nGShmMSuMcVgUyjQ",
        "UCd-B-J0ijnZo3mODqq-t15Q",
        "UCWSrV2Dj98Q4fVp23wUqPhQ",
        "UCqAKnz2sHsJPOrCyOvdf-iA",
        "UCKmmERguliWTynG9OIoDhDw",
        "UC04lAYEYR4BiaJkbqArxmRA",
        "UCxOzbkk0bdVl6-tH1Fcajfg",
        "UCngGfEv69-UtPuL_Ipcy1yg",
        "UCcTkmCKTneoDXdfkH0vGJaA",
        "UCx9XehuwNHLqWPt4U0t0LRA",
        "UCYvmuw-JtVrTZQ-7Y4kd63Q",
        "UC-lHJZR3Gqxm24_Vd_AJ5Yw",
        "UCWc8CackfCo4q46FpEWBcPg",
        "UCUyVHhyGAR3djWzqlljIN1A",
        "UCDxRH_wOCO1LDcQlK3F8_HA",
        "UC2IUqmI5KpKKxtEa09JQyxw",
        "UCAYtvdQSjKROxNqMxMFQPLQ",
        "UC7-AfAX_aDvwmFy4sg4h3GQ",
        "UCU-0c1hN3jzWTdIetJCUULw",
        "UCflojTNXBBIK6t4ChPStXrQ",
        "UCFSx08Ew0iiWKyAz54Opdhw",
        "UCUylmntW4zhJVdGNHHopr9w",
        "UC_f347Y3j5d4Lo6TPjtXtyA",
        "UC2eveKwtwzGoou6iIeuPFkQ",
        "UCCzPRj-FC6utU5B_47eKv6w",
        "UCAiCdQ4fDNiaXG7SkuDCydQ",
        "UCMB3rPPxt7fTqxiTpE8WISA",
        "UCcXVebR3b5ubo6BwXw2Ksgw",
        "UCiwOIYaPaAqoVCtfj_8u15g",
        "UCVDXo-Sl6rEIRe4CK5AglAA",
        "UC0bd-v3wG393EdRCohERTKw",
        "UCp7HmWPgC_4FN4sPS4zdwng",
        "UCCECL_jEMgxp9Iw6EozmuUw",
        "UCAMueLRRairI6yfByXrQhRg",
        "UCDNjJkFYzIQkDcH_myhdehA",
        "UCbB62GcfT10Q08ZIqdpDagw",
        "UCyIG-lODUcBe82oXg4x1sAA",
        "UCDg0VvTcZRXJ2Ax4YeTFy_w",
        "UCRJIgQVYJdx2XiNu-Nli4LQ",
        "UCixNwV1t6OVjrWKVPiPjrcw",
        "UCr3Lrf7n3h3XGjkxTOSRMCA",
        "UCw9XVOZBDJzOg3uZJMjDC6g",
        "UCSMML7H_PjVmxeZeo_jSjIQ",
        "UC64KwGynvj3hA7T0C9gC5cA",
        "UCTP1RrnJ8meL1iTmBC7LSvQ",
        "UCt_NLJ4McJlCyYM-dSPRo7Q",
        "UCJyZfWrqaGX4nwXGKOEdM6Q",
        "UCEfkxJ99kPCji_ApA69SQeQ",
        "UCohlG58U-fF8AxSEeB_-FMw",
        "UCyQ-DUV6lZgoL8wiPusYiUg",
        "UCvILah8hAWYhYOmAG3ZjvBA",
        "UCBDr84m_kcMea-oEQ0C6ckA",
        "UC_7tXpskVUnH2Mv9_nQuxkA",
        "UC6Mjg5R5QOJYjrio1JmP8Fg",
        "UCg8qhiH7JRWXs1WNstdGDBA",
        "UC65BBxbCdWzwycLdQZiHk-g",
        "UC3vhMqBozGwBbLCE9d3lyZQ",
        "UCiG4nUKZAuvPwRTLbF2_O7Q",
        "UC1ToWcL9f8RRXuBhQSXyIXw",
        "UCvZ2GHtdVaNDQMjZRe3v-Tg",
        "UCnrz_ij1bifCX8TbF91t4cg",
        "UCkbqWL6NDfi_Uqbqd_UOm6w",
        "UCwhnG4eZJGzKZBERAtMKAfA",
        "UC_oTfJa5rmhxnoat5jseMnQ",
        "UC-RrTZfZAFlqqtme-R_ZD_A",
        "UCOI4h9BVhHMC3G-3hkzR7yQ",
        "UCoNxjVCzvR8teTG78wfyADw",
        "UC2G3rkQvo7keWAUWJ0K8oWA",
        "UCaF8pHMErgJQ71NEd3P-nVA",
        "UCHkZCYfrR4LCY_d3M1igE5Q",
        "UCtH7VXC4kowqhH2-RMq0F-Q",
        "UCvHTSq50DIU3fxqJafq7S6Q",
        "UCqB6BLkHiIKrbcX8gB38Xsg",
        "UCIBuoLQHUfbBnQQ3DXStSYA",
        "UC5TFfSO7m1fqOq5oagXQXYw",
        "UCdZNCxe-Qr_dUVttbz0UVBA",
        "UCz5gX99KV1zJvBgMFZAomzQ",
        "UCpDUveyA7F5j-aKXzuZArYw",
        "UCbPD8bJJkbD4pqixgWwCPsA",
        "UCf-wTPj29_He4WqtatZZefA",
        "UCVruJQDOaSltu7Z2ita64nQ",
        "UCzBmZcTRtMUhithMG095Pzw",
        "UCPs2_fXu_zZIQYI5lslUISg",
        "UCEHFYTkv0IIn6RYJBNcgr-Q",
        "UCSir19L_390tAg4IbCggvCg",
        "UChBEbMKI1eCcejTtmI32UEw",
        "UC8SNsIS6XZ6WaEeEPCSVaQg",
        "UCxw-HVPP0iNCpXTa6gTHdpg",
        "UC2ZlZqXygcTCTlf5oNU_nfg",
        "UCRpjHHu8ivVWs73uxHlWwFA",
        "UCcjk-KvDJBEvo8fJS29fekg",
        "UCKxvc8h4kb11SjGXaXXQuRA",
        "UCdEzRtsIOFkBtJ9FuAFB_Zw",
        "UCy5C1ivE3Jt0oa6c_iENTBA",
        "UC8ztliHlp-Giv1yRKSoBZeg",
        "UCjfsn34VPXvEr60yxOejKbQ",
        "UCZIK5eFM48VfVp2PROxVb6w",
        "UC3DQsLbwDUnsApHenmmO6ag",
        "UCSchfBYlOjv09AfvSMXxgIA",
        "UCNUsLXlsw_OYA6PfXOaqTHw",
        "UClIO8c8Cia4LVScE67LvtOQ",
        "UCijOmqvo_qARmsFHk5KSrRw",
        "UCZtIOBxgLZGY_dvACmW1tnA",
        "UCHHYB05slIGQR5NT92EPr5g",
        "UC3p6tgSqCb-T2EQfebx22Og",
        "UCqERUCXXj4HzpwJENLn7-zw",
        "UCzjlAFMSNqIU4vhExPmczhQ",
        "UCO9yfpkWdBZF6FsY0UjjSRw",
        "UCxgDfpB3rBRPozm3zzaRXTQ",
        "UC5gxP-2QqIh_09djvlm9Xcg",
        "UCVAbWl3d3XuHY28wU9DoDpA",
        "UCQmFNsackYMAg31IsbCkB8w",
        "UCPuRXEsnJZJ0NkK2XwmbuCA",
        "UCk9B56310g5AREYmvRvcuNA",
        "UCe1IA5kmY578O_Qo7Skr-TQ",
        "UCGnsRwFS8Xm13lMAeouzT9g",
        "UCRE2zmVNW9wG2dndMoV4JKQ",
        "UCtNxjL-8WeFZ6LbfrOYgNoQ",
        "UCPlAajHOOhPoXlVyweFHnqg",
        "UCwF77i_Ks5M4Dpx9ULT0_Sw",
        "UCfXj9asBtiIIVlbp0wXWXdQ",
        "UCeYes53L01fdS4SiNv-ldxw",
        "UCnXwXrQ8KIBoV8k1T3xGznw",
        "UCcK2zRWjfPWrK2DjgiYQ9Lg",
        "UC6BaKCImYHSbJfXejE0DdcA",
        "UC7AmzwVjkG_gaFjWtGpUrYQ",
        "UCJ1czRR4Gstf94VvRvOff3Q",
        "UCdP0sBRGdiqWgkyIMhg90mw",
        "UCoGveWLbmCaeRf-3I97LX1w",
        "UCsTETijLWQxR6bj9XQBvobQ",
        "UCE4ekDSrwHOVMEHTfpQ-DZg",
        "UCxonQQlLtwMjmwOitYL5hdA",
        "UCupjKvR71lbE0VpF_lfB_FQ",
        "UC6dtjRVZ61_Y-HohzJ24ObA",
        "UC_gSotrFVZ_PiAxo3fTQVuQ",
        "UCEdjL1kbZ0K8nFu519vE5LQ",
        "UCioNlo-f8kcEfT3Py4j1sVQ",
        "UCS4uc8cHDqcwwro8lGChaQQ",
        "UCQHX6ViZmPsWiYSFAyS0a3Q",
        "UCJrOtniJ0-NWz37R30urifQ",
        "UClbAm32dh0WmRLaqZlpGyCw",
        "UCPHuYCxf9QJArw-4ZXXC7Ig",
        "UCX2Pm1JoWF3chsVOR9e1hbQ",
        "UCLHYWdHibzsnW1M8ezRaxpQ",
        "UCranIPHHqqD42z5pl_BWXJQ",
        "UCrptgMuY4prFx6PYUuh_Seg",
        "UCgAmmVZsZ4vfDH-vtWawaOg",
        "UCI4nkoEojwi8CZ5Ql0UBPGQ",
        "UC7jJnOHq7ZQWyNV7UxFFF1Q",
        "UCqot2irMc_8YrPRF-ZzFCXQ",
        "UCt96nduE3s3QuEICGScxtpQ",
        "UCEVT-8wVdehHFL_1fkqJz3A",
        "UCf8Z37FhKKRH_Zw8Z_9SUKg",
        "UC1tOi0DDVrPZmPULtNRSX7g",
        "UCGUyYpOkxJ3ZQKXKgoLo49Q",
        "UCb-VnetCrVVHHG0XqNQOD0w",
        "UCeXsEOBQQp-n2ThsUE0s5ag",
        "UCO6xy2RvscA3xUi2yKIyqWg",
        "UCVNSyYuNQUwJiD0TVst9Szg",
        "UCuvyV3kjlg83J9C7lXPhmAQ",
        "UCeVkzeYJC4Z-SUde9UEJBwQ",
        "UCiM71b1uwRZRFKb2nAi-lhA",
        "UCOSBz_tmQfeXeID4tCvCexg",
        "UC-OknVbsuiHqT6LFPcKWlDQ",
        "UC2VUDuZ7jnp1Y7XmOodei8A",
        "UC0C-w0YjGpqDXGB8IHb662A",
        "UCNqFDjYTexJDET3rPDrmJKg",
        "UClgRkhTL3_hImCAmdLfDE4g",
        "UCWfi5ELXGAe-DCA6cOP3aNw",
        "UCbbm7p8Sk15fmeU0LWk7YwA",
        "UC5kSbdRcfusZhmVhETFisgQ",
        "UCwWV1kca2W2QZT8Hklpum-A",
        "UCuIHsR72VU2ZTf_1-K8l8kA",
        "UCJCMsVMH8qcSG_NYOT7lPnw",
        "UC6FfVQlNBkNYJqL4H8LtGeQ",
        "UCzi29j_myNEIslRmcxTxLBg",
        "UC67TJqYoxrdkox-FoP4N6KQ",
        "UCO3pkWNzi9hKhLlJB9Xa2rQ",
        "UCignBkCOYYgGrkeOKds-g6g",
        "UC2a1E0E-4CV38Efpes6FDoA",
        "UChMcBAB7scKNScBzHb2qlqg",
        "UCkLidpONkXfGcYtZKFIYedw",
        "UCeEOeyS49pefQhG8-AR6i-Q",
        "UCPHZjxjY099KjTp_NWqdcLA",
        "UCKEyS5RRuyRvfnEEc4cmAKQ",
        "UCuBvl8mzPolBzPU9ju4cXsA",
        "UCIU0JRRQDRNFTMA9_e2Hutg",
        "UCPXRxl7CZgEPYtUtrpu_RlA",
        "UCOtb9r4h4nagt8iYAFDwUzg",
        "UCQQuV6yiDRKKxkt_c6lpDHw",
        "UCDoKV0NDXZ5y-Q07mFmAACg",
        "UC09GemGjss3hPdljwtJ8TPA",
        "UCkwXupRgX4zOyqMHKRIBOww",
        "UCE6acMV3m35znLcf0JGNn7Q",
        "UCIH0E-zQ3-HzYDChlpafRsQ",
        "UCj32fFKNF-KLFgeKXmjrKag",
        "UCDdhbyr4UReu9QtGN3UpHFw",
        "UC_Ue-KSLEUsk5RoeT3DzMFg",
        "UCFBtG6VNcQ0gdrN9RG7N7nQ",
        "UCrH2F-06kl65_vXpSSaSqLw",
        "UCTLgrjNpQcIEJmoZFmwlNaw",
        "UCAwWYtUshRFxEHlo3dRYBfQ",
        "UCb12vdIDQu8NhyIWbHtmHmg",
        "UCi1u3hFkXx6rFJJp6TtY2cA",
        "UCA8Nuj4b4WqtzCZDK_IN5jQ",
        "UCSEN9ZXiJWENGzlW_H6A1qg",
        "UC54pusK8dB-bQseorCfEODw",
        "UC9tfR17jfmClZldZmigCx4w",
        "UC2NbkwekCWW12Eik964NIxw",
        "UCxbyDapSavjgvdtpcJ2BJKw",
        "UCJEdqOhpTEtHf246ri8vkrw",
        "UCM7dQ9eFw6YYNqnMHOtqcHA",
        "UCaif6JhVNhqimp9h0iZLjqw",
        "UCEclJUeQDYh8id50Jg1tyEg",
        "UCMqNfeJjAXHm3HlSO7qgKwA",
        "UCWXcdemE-1OGDhaSAPAw-4w",
        "UC-KkVdOP86k1SDAWzFfw8nA",
        "UCCNPPSSdTTdTtyQ3av4-0eQ",
        "UCYUq_wB2ieVws9K4kmjWcaQ",
        "UCbPCDmtTU-W4SdA8abZtWpA",
        "UCchgIh8Tc4sTmBfnMQ5pDdg",
        "UCeoRAN5sr02w8_9aFWxIM4g",
        "UCp9X2X56DDzKbU3onxQdInQ",
        "UCW-FVSo0JnMy7mEK5ELoHxA",
        "UCBWPWHY_lkcRXL3rY__WnuQ",
        "UCZzJqh00HsbCUx9eUuhhOMg",
        "UCyowgJC3zrJ9B9_Xxd2DrAA",
        "UC_kQy4EI_En6if67MTO6ziA",
        "UCMdtMjHpovFP-Z-5lUWAbBg",
        "UCx57sUoOfb_AdohgKcl6Qvg",
        "UC86n6JyGft7tpIiWSeRvMcw",
        "UC5_1SbZ7akYcomHUq-3eUEg",
        "UCtDXlMzpdU9-A1fCBdRZbQg",
        "UCax4cUs81egVhwFvMck3tsw",
        "UCrSvPF9fXF40jAxuTN7mzWQ",
        "UCBSBxBkz7JZNFs1zc1DR2CQ",
        "UCBehKvyugII3ADIyuIXFtAw",
        "UChp3AhVoskT0PJEYww7i4dg",
        "UCOvfY8sq6TVingpKuV-XCzQ",
        "UCFdYUGySRHejYl-MraT5YHA",
        "UCA3_auv7ls2EnECL3kqqXTw",
        "UCBmpffjeg0WhPJd8b8BOONg",
        "UCcpxOjYfFEWv_pkdgn6TqpQ",
        "UCGvj8kfUV5Q6lzECIrGY19g",
        "UCZE88kYvCKUKjM-G0uc8Duw",
        "UCPU5-g76CquRaK5aXbmIzeA",
        "UCzzF1kdBgwv5RB6rbB6kVSA",
        "UCy7OYMioA7AXIrNgrDSb-Vw",
        "UCv4oqMvUvdGryifXJ18UWvw",
        "UCacXXvaNHJQhMYU7f77OrBA",
        "UC-8RFAZFxKGXZlgp9jc2jRw",
        "UCn9H9WCUU5jvsh5uTdVJBpw",
        "UCvQoBMVWiHRfQL90Wq3D-aQ",
        "UCTTfqh2EX69h6Q-IZCHYdIQ",
        "UCvrGoq0CFqsGG1XJ3m7b5hQ",
        "UCkrbcfCQhgYdoi7cYUB_HKA",
        "UCR-W1hBvmDx4stuEvY3rP2A",
        "UC7AgOAEVN8Tm__WRxBnkO5w",
        "UC7gddhR-PLNln9SNl4TvIqA",
        "UC8gJTvv69GUDyxpFY_cPCiA",
        "UCLnhbX-Zl3HOvhwX5g4A90Q",
        "UCe3jeR-Sn9uR9kgqlVYv1yQ",
        "UCNdtj6-S1h4vK4rOOarnlrw",
        "UCtLo1ovTSFkAm09lpoIkLYA",
        "UCyny-dfYPbE-CjAkzkZqF8A",
        "UCblktpvOSXAkbI-lnxLaj6Q",
        "UChbaKJjkXutsq1N6OV9gJjQ",
        "UCtgGOdTlM-NdJ9rPKIYN8UQ",
        "UCpH6zd2mjaicUn4ONhRP0GQ",
        "UC_hoQDD6zKcIqpIYLsFbBeA",
        "UCYxsXxbjJO1YYa9yQ3lKC8w",
        "UCdcUmdOxMrhRjKMw-BX19AA",
        "UCRftLfHGuTeILm7LJ8Isahw",
        "UCQVaLHClkC4C1BjW2_dnM4A",
        "UC9K44RtwiROAwCpALm1wdyQ",
        "UC-JAYs887GcRROe_z9Kj2sQ",
        "UCw8ZhLPdQ0u_Y-TLKd61hGA",
        "UChyTfYB9WplJ5nx4Ne8K23A",
        "UCsqjHFMB_JYTaEnf_vmTNqg",
        "UCjLlmhU43m-Fv0PpJKcg4ZA",
        "UCDedhFlwrdGtiAWG2-Sw4gQ",
        "UCHy548EHHX9f-ETJlm18Jiw",
        "UCQyxAetFwVRxWLmb9o0UC7Q",
        "UCam6JahBz_2huETMYZWso3Q",
        "UCGudDzJIPDUHQbXj_ziW08g",
        "UC2B33w_PHFHhO--oA-lyvXA",
        "UCm5zt1UIqmfx55lbQxugA7w",
        "UC_Loz1NBsnLLVowFrmzrcUQ",
        "UCR4U1qlclYFYBKGtxwKLvGQ",
        "UCWOWBCEVCQXSx75MSaZyrEQ",
        "UCBPJcXNfuR8pI0g5ZulkUyQ",
        "UCp2Aj33O1HM8-b_5zvvcjzQ",
        "UCV3hDQdOqtPybp_UcAJ1iFw",
        "UCIhywPWTygL9bC3sGgKagoQ",
        "UCDSdhVItKuZ7StYxDDyk10Q",
        "UCX1tHFruwSSHGOGXgH4rSuQ",
        "UCgwdDDtsC3i4MPNVZQ6mpKg",
        "UCn_i6kb7dtvELx3ZZNaymDA",
        "UC8Tp_fYRJlLPiilDJoq8kBQ",
        "UCsGssFDt-RXcxbeoz9UU5og",
        "UCxYfUjkImRVF0Y3N4FVNqIg",
        "UCSDeDWxMRYuzpqpFvYfk9vw",
        "UCYBc2e1TQVLak9gH65kE2IQ",
        "UC-ggDegjGitJN-XFD3D4iYA",
        "UC5bGFdve6xcckHAnBPsp80g",
        "UCGVLeVXiOsn5d70sNG9wS8g",
        "UCKRh-xcGG17m-5CPu6nPLPw",
        "UC9rBX8tAbz7L2HvZL95fHGQ",
        "UCf__vTGB0hcWTONsGsLuR4w",
        "UCzjEaNu4XLpX6I8nyE_cQZA",
        "UC5Ida86tt8QKa4Myw7idxNg",
        "UC1ItZv64Ti9vTYTE1GmT7rg",
        "UCeBWh-0p7vgBeD6HOHBpfwQ",
        "UCULKfQmsbS0-fdg19sZN_MA",
        "UC6VSHNAVaCE0kIGqgU_AtPw",
        "UCPIavfNa4DTfHXDBaFOHuKA",
        "UCaRmPY272f59rnROXvIxk_A",
        "UCyCI7K2yxiHHgFXikvdez1Q",
        "UCfw8x3VR-ElcaWW2Tg_jgSA",
        "UCHkkUuVWTSwN82IHIhxq_jg",
        "UC-uuj0g1QdwIHBJO8H-BZEQ",
        "UCW3G2XfMS5C4Rgter2G40kA",
        "UC0XWC2_UZMkXPGn4bj0R2Uw",
        "UCZMA85v30P_Ub5ooAO62BZQ",
        "UCP0p8P_h880HFJ0qa6Kgwhw",
        "UCBNnILlexKYtJu-EGUvq_iA",
        "UC_kRDKYrUlrbtrSiyu5Tflg",
        "UCFNTq9XKHDNy_1-2lL0kqCg",
        "UCVJTBa-2qs3RdgCQtgZ9OEQ",
        "UC8bMdmOGVOm7ap9GhpOwFLg",
        "UCTCCHd_nMPPohRGBqmI7L-A",
        "UCYIDhiZvVuGcXCrQwXaUZGA",
        "UCj3G0N6aAPy8wMXofy11Rfw",
        "UCrnlut4j3Ymz8MmHhmf000Q",
        "UC2UG_iYck7UlIsZDc7q0l6Q",
        "UCBNuGbjAnnf3w5nlXCbAkpw",
        "UC-hPbpdkqesxojT_AePrRAQ",
        "UCHP-b9nbZ3PPsWclveeSa_Q",
        "UCSsyT404QnDgJzrTwkyglqQ",
        "UCSuzswNAnqhch7GxCCj3FOA",
        "UCAoh0KMOXmxV1qyBBHjxTaw",
        "UCkZdiaFT28xARAgPJnFGPuw",
        "UCQP8d0ACPUnRZIE1xQmsXIg",
        "UCK-luCSD1402aYai2-o_zQw",
        "UCVt4ugq2txl_szlXAO7B3-g",
        "UCyzsn4pjnW_AgXGR0BFbaiQ",
        "UCZtQwMjH66JQiTg4VnyzkUQ",
        "UCvxyLDg7FD0lwvR6LqtXpag",
        "UCJRIPXlXCsupN4l7ASRVr7w",
        "UCVUhIjFt6RaMYpjjEseoDaA",
        "UCgR7bXEvJ_LvGfT57jmoaYQ",
        "UCRGqLBr34FvnZjqX6KSC04w",
        "UCCVB2ytMOar-iEUtLFW6eOA",
        "UCwxGZjqoKt7WfvMUkDbAQmA",
        "UCAfRk-fbNGwVTfbXcmhIWoQ",
        "UCIvqICThwRWUq0WbNcn910w",
        "UC36xmz34q02JYaZYKrMwXng",
        "UCjVewZQEpWj1wfUAXwP-VAw",
        "UCBQ_MIOpEPsIcdBdDUlY_oQ",
        "UCpJA3TjVgApLW0KlITGhWpA",
        "UCxRGAdRDIhaSYg_Wd2V3Iig",
        "UCtUeiT2ibSEqz6-O1GrbDTw",
        "UCA3WuALmnL2y-uUETWNkEAQ",
        "UCY-BJOL-pBPgLIARZS_KgGQ",
        "UCWv3BTK4IIgVEQCO-KbvOAg",
        "UCpwp0Plzy03Dc7qPvSmIvPA",
        "UCZxHoVyrJ2jsjyd72JAie0Q",
        "UC05gI8Xuuhq2beU8viQ3Szg",
        "UCuCFtO6cUoS0GOG_z6hfWtQ",
        "UC5e2YrDL4n5c9gsMfyaq6_Q",
        "UC3qNksvJzW2SseflY2HhMvQ",
        "UCGVGNgWq7FxffvokaRrGk0Q",
        "UCruYwl445b-s35K4K77rZHw",
        "UCN_8fVOJD1rqVEeivtE0euw",
        "UC-nrW3VI-dDXNuFMJIuLW7g",
        "UCIgeYqubI5M8LoLCcZqwlpw",
        "UCcC0Vg-luhmJErWbFmAtudQ",
        "UCxiDazX5vWrcw39wSvxIVEA",
        "UCcuXAqZJ0fMr1E0Sr_jIAwA",
        "UCNPtVT4V3dkP388uLdSqcxg",
        "UCODHrzPMGbNv67e84WDZhQQ",
        "UChX-Cgkfava-G-LlfwC9v_g",
        "UCHWfAuT1j7bTLXTIBcY_l6w",
        "UCairdvK_SE9uvBiK5b6g22Q",
        "UCaycGxaoGRDeBbkfAZ4mqGQ",
        "UCmiFyFR0jl4fkUUA0YvzU_Q",
        "UCyG7zAV_2JlPnxhwDxZN6sA",
        "UCBo1hnzxV9rz3WVsv__Rn1g",
        "UCAEHrhfV8zfLcl0XsE2kVVw",
        "UCVa6JbWHIy8W3Zo1KII5Ncw",
        "UC9qM_JJvsHf7R4bUx5rml5g",
        "UCgZlBRLRB1-0l-qL9BkecLQ",
        "UCzc59v10qvwWRPrYoWUKEvQ",
        "UClkRzsdvg7_RKVhwDwiDZOA",
        "UCPKNKldggioffXPkSmjs5lQ",
        "UC4PpFUrfT2Pou7OwpVF0MUQ",
        "UCfkXDY7vwkcJ8ddFGz8KusA",
        "UCSnNUFvvfLRmVVytvF0EYDQ",
        "UCgoM60ZTjoUsi82A6KpSl1Q",
        "UCxtLc0Jqq3SKBWlIXM_OC9g",
        "UCF2n3RGfz4-9O2I-8lQjHkw",
        "UCiU9mHY9vsfwO-VEpIlfrow",
        "UCOH52Yqq4-rdLvpt2Unsqsw",
        "UC3m0s5XAQydCtbLHc8j1Uog",
        "UC3Tjj344taq3njy4yaK8ZWw",
        "UCWbZmYGY1JivFjGA6NL9T0w",
        "UC-NCnfxdAwke4hYdLEEuJfg",
        "UCsIvYoihIg37E96LkG-XHAw",
        "UC2MDW7cjUSt7_Q2F7Cg2Iaw",
        "UCyje3jvepx1bolRDjZYsF2g",
        "UCCaFYslhot_g4QxMjAcC0gg",
        "UCxDeV5tQGFCOfBsLf4Q6EZQ",
        "UCRCK5FCJtomQT3b88jXI_DA",
        "UCVIMDvlsm6ThpS8ixu6Gwyg",
        "UCbhsMbBEOm1vIpOZXbaZR7g",
        "UCnpFo8JuJu4DksPXKNA7SRg",
        "UCSK03Dc7NgqBHaeS_WwhHeA",
        "UC_1HVMnw-610qx54iEiWk7A",
        "UCMOLiZpKXp-w5CNfqJObQUw",
        "UCbCJmNKAL85O1VFeD6Wj60g",
        "UCAkCZHtQdPWvbwaP1KJBjvA",
        "UCeA1RfiiOCdoihsBkQD9paw",
        "UCNzFhleZyCHPeIgmp-McMmQ",
        "UCpn_ODet9knMmEj5DB0_KnQ",
        "UCNJsa60W08xTI4lFpPn3SWw",
        "UCOMZWkPo7ao6yGaXc954U0w",
        "UC9zY_E8mcAo_Oq772LEZq8Q",
        "UCkwJXqFl-9VVvK9udYCFjMw",
        "UCSRlsiI82pTMsKAo808MP2A",
        "UCgPQWlJBxUFcGCUHkn29Fzw",
        "UCRxAgfYexGLlu1WHGIMUDqw",
        "UCaminwG9MTO4sLYeC3s6udA",
        "UCSAp0Yl9S0Zq5uDqE6im_XQ",
        "UCejtUitnpnf8Be-v5NuDSLw",
        "UC3SyT4_WLHzN7JmHQwKQZww",
        "UC4gH0BcRb9tIzXpXXC0gC6Q",
        "UCGaZJc4gFeMPdAZNFF-IJ7g",
        "UCExUNUI0K8ngWBPtQb9tHPQ",
        "UCyWH9r_JUHM2FKnVmuvSoEA",
        "UCXz11xTFmqxllHWnYX9Wqjg",
        "UC-kwiDn_sPRckNtYLs-B8Tw",
        "UCalDvrq3JLFnZZWGTch7ZFw",
        "UCn-iKsngjWE1-gkdleL5VmA",
        "UCGEgNXyImI9McrrI4COLU0w",
        "UC7MGEfKqdmwVy9DRDG_8uig",
        "UCBo_jX0ZGV7qkngwAfxXOqw",
        "UCG3aNwnIiK16f8ezkg15McA",
        "UCrFTn815L2E8yDVy0avgAWA",
        "UCjCnA_yrQs0bscdbI0x3D7A",
        "UC0nNMx9v6Hd7YcLEyDT6I_g",
        "UCGiYeKGOTc8gnD0_9FH3LCw",
        "UCzz1Y2EvAchoNMIXivaDcLQ",
        "UCNT3g0zm8rCPsF2AqDPVuYg",
        "UCa6GZxWJenXYyqQXYQhh7jw",
        "UC9LkVnXIgiBTgH5qmm0o78A",
        "UCuFd1aoy09eNaT2X_tfhXpA",
        "UCgQRFVpJz8O2Jccp9f-Pi_A",
        "UCTxB7kr_D_artn9TsvPxYfA",
        "UC1HaAnuN7zIDwKJdssh7Mcg",
        "UCumhV7sACHa0cRYQFSJP2lQ",
        "UCC_-xi26Wo_INjedG907NhA",
        "UCFK6SOcOCeu9mW46-D19ieQ",
        "UCtpvjPo11dYzvkIJ0ZbUjYA",
        "UCMKeK9fTHvlTLypdLRh3cUw",
        "UCZecnuVvQnBCoopyobFdDZg",
        "UCUj6rrhMTR9pipbAWBAMvUQ",
        "UCoCUgs6Sr3NkGRD13HJaS1Q",
        "UCmN88HSz-EQdwrkGXkc1ElA",
        "UCVJT18d9wSCnDUdnJ9ycO7Q",
        "UCRWxH4fGhuNsh0klWnDbt0w",
        "UCh9Hs6LCnksZbSs2SqSdfqg",
        "UCJOkzVhjoJL9W_6m5VDeIpw",
        "UCRfUUhwRYmZNGDeduMoHrzA",
        "UClUE7d0UQ7dhLjK1r6xpG9w",
        "UCnh5XIfju_wUyFJSunX9Ylw",
        "UCiqzJvxI9AIZke4fZzy8Y9w",
        "UCD5io4qo2rNngbHs0ewQ0cg",
        "UCetRMtwoB57jSmAObVTXR5Q",
        "UCQA9gNTMeHYZHVukBQ79Y-g",
        "UCdRdCZFZ9cdAv3bNvE0V21A",
        "UCLIg4UJC7fjd-JsYDm0eiOg",
        "UCsu46tXDnUq6EJplsAEcneQ",
        "UC2GkOIvTZSne9HDnFnEOd4A",
        "UCb2qAhX32bNxYoIgNgqwzLQ",
        "UCccYr9UoBuC-BfyQwXBprVQ",
        "UCTSfPW6f2zdr1borLZMoXaQ",
        "UCjlshQ-zdTSn-J-8N9uGh2A",
        "UCqfm9cM8cJBFvTWHNm1bu3Q",
        "UC-dBSBpG0tRI2Yy5UFeAplw",
        "UCm7fmBqDjPe4vxvR9eY7ljQ",
        "UC1ZW8rbX5Ezched-FMoFckw",
        "UC4onZFuO1KD5b2bG1Qcx28A",
        "UCwEYSP9fFT29gLVkohSd8YQ",
        "UCGYvukrvoGuNKrWQVuFlJOA",
        "UCj992YM45Hkg9msqWVQYa1g",
        "UCNilrbfI8ZdBXvPSGrm4Isg",
        "UCJXO6DmpYe5hCTwdKBUv4qg",
        "UCR-t_mqoIe-IJnMiUmJ2Stg",
        "UCXG5GPdhZuaCtCZoU2Ps1oA",
        "UCbfm0YMM9yqJi32Qq6mDd-g",
        "UCGikk57uOAnyQ3AjouyeySg",
        "UCrmGUSbiem2mRNPAdcMeJQQ",
        "UCfIDVigVUrdRZAJlR--7gZA",
        "UCBF6f1jFglBDsU4vPJnCJ5A",
        "UCC08vKGCoMwjoDdglMP3p3A",
        "UCodBDtYUuhigSVKksHpYMTw",
        "UC8iY27VbBMXarhnaVAVAeeQ",
        "UC5zxsl0xmfrUrD0qcb1hcaQ",
        "UCRgMIwmmh1-2k5HeTQ2cdkQ",
        "UCeiAKuJGZrIjYvaq0nMwbJg",
        "UC3SqdQlsHd6gBUuoqL-BWWg",
        "UC1NOaL6Ht6WJeRipKm84R_Q",
        "UC5aRwQKjS8s0TnQFn2yGU4g",
        "UCT2xzagsBVtStUCA2ulvKmQ",
        "UCkSSmmUGCWV224014aOF-aA",
        "UC7adUjW8qMUsqO4HHTbwKgg",
        "UCqTmCuf2W7IMrvYrxFlmufQ",
        "UCYPvAwZP8pZhSMW8qs7cVCw",
        "UCzwCEE_PchiBULMnAJqhGVg",
        "UCnYKRFQRndE3Wq1eLRQLfWw",
        "UCneyi-aYq4VIBYIAQgWmk_w",
        "UCwCxNkjbTz-QNE4voI8t-5A",
        "UCRd3JpaCReY0OUCQG8J_6cA",
        "UCNn6AaHharXIbkRleXGboiQ",
        "UCjiPxzIyNtfQ2HZZ1eVjZlg",
        "UCx9E-DsclKNYagm6Gv61Cqw",
        "UC6vd-JCD7Z_FuF8N5LTydPA",
        "UC56gTxNs4f9xZ7Pa2i5xNzg",
        "UC54YdCc_k8Qu9ijZRoTJkOg",
        "UC2BKodozho6piEdcSrb78jQ",
        "UCZSNzBgFub_WWil6TOTYwAg",
        "UCNvYCW3cMbkWy2g2v4Wb6xw",
        "UCYYhAzgWuxPauRXdPpLAX3Q",
        "UCR1hQY5sz5NEYofdv09XimA",
        "UCnrG75VRwdlp2wtwfpOCBRQ",
        "UCcvDtzV1rWjmWFacEmVeEhA",
        "UCb5VloaCje7byBIhowRUe4w",
        "UCTqY1Bpxj7MXVuxc-UltGiw",
        "UCyxp_NmHKTuHHki8jlTO1QA",
        "UC_uzA75bX-ZU9UQHlL8fZcA",
        "UCHdnIhplpy6wUBszq9rQDgg",
        "UCuIajiKVRTgWMyJh7MRvwaQ",
        "UCMcSV9CxumtodbCM9_M6ERg",
        "UCkJGqyA_81XScrGZqN29cnw",
        "UCDwIE9_Tl15wdB9uyfbclvw",
        "UC8QiVb_JaYyaffWSrQsJNLg",
        "UC9TAeJBXVS-eJI8fBq0cQkg",
        "UC2zhA43W0vpQJK-fVfKfsjg",
        "UCY-1L7H5jXlVVSf9X7Zf2Fw",
        "UCkxasXAalt1vuGXZ67YZTuQ",
        "UC61PCszexp0rEaX6h1sKCxg",
        "UCapTz8fBuv-mXaRnmO9_UTQ",
        "UCkzN6FPRSggyTY7wtuwHBXw",
        "UCeF5sxjXSdWq80n3RA9gBpw",
        "UCzrdcEZfNZ00g7HXEybWnTg",
        "UCneS5JrD0vl6dhqs7FCZKCA",
        "UC8Y6BZ7mPrGOgp1IsquW3FQ",
        "UC_wU77Y_86U_YUfFhNkhSfg",
        "UC-KEkQQVIYyEuvBe5CsWSMA",
        "UC72SAQK22BChVQhpXAXJlpg",
        "UCKlG5q-H34c3Zkgye9BvjFA",
        "UCFzx5rZOkI6Y0fvjBrAvIyw",
        "UCMQQ_XQbJT1AbOPhAqpryIw",
        "UC8BzJM6_VbZTdiNLD4R1jxQ",
        "UCtBu8Wb2BUoduUXJS9Uss7Q",
        "UCqwUnggBBct-AY2lAdI88jQ",
        "UC6XFHgLK4O6sWUgcNRUQgRQ",
        "UCiu3bj4rR8KOYcUA4KNkOAA",
        "UCuy0xiNqTQKDTS9aT5LDIPQ",
        "UCQ748_HXXwK7Mk0zpvqHd6Q",
        "UCR-zIwe4bydqT5Y8aT3lWgw",
        "UCTXZxnoLYLZnwyVXiMoBgPw",
        "UC4lCjIlAGCliCrC3OBuOiSg",
        "UCL6JQ3MOkKSfmeqw38j809w",
        "UCv_MsYFGi-RHrNajHqqUJ6A",
        "UCMw2QZuFUZxfFAFZ0hOLrZg",
        "UCYDyGdodMhIuJ7WGmn0Bn3w",
        "UCRx5wGCl019MyWo1tzVpenQ",
        "UCYPuvJzvt5RLcNJcPODLzrw",
        "UC2H_KDoFgXd7PX3vIlkOYxg",
        "UCErP0PivmF_qsV65QKMuOQA",
        "UC75jP6Q-JPHF2FSUYB3-c9Q",
        "UC73kPPEdS1feJpfq_sXmaYQ",
        "UCboQsv9hXUR06h0uJwTAr0g",
        "UCEgqJ5EKBATUwpkM6fVuGiA",
        "UCN85dICtM-7FuEqP8n3SSQQ",
        "UCH-_NjZ3ojREOwBZt-3pYLA",
        "UCCxUldABpO1I-V9l0oTsoDQ",
        "UCa3XfT_AccZCELBLC913oEg",
        "UC0pZaNTzixgpaddyXV_9Sjg",
        "UCfNaGmiVzcAemwe70TZe7Gg",
        "UCPflN2lItFeRHxjP0a4m7Fw",
        "UCRkvlZJjyDbYEIlXjVSUR3A",
        "UCJcCB-QYPIBcbKcBQOTwhiA",
        "UCKPln7KuqsQTLCAVbmV_UjA",
        "UCeLwPevS4AoON-3YN7NL50A",
        "UCV-IgqTvNgjCkvllihF-s_A",
        "UC0KYLubXIUrkWlDUeXdF-rA",
        "UCsY04eM72vRxuPoOPzeSD0Q",
        "UC-a5GRppjmB3bAy60Jh8qwA",
        "UCCRSc5ARkjJxX6nvefsX7Cg",
        "UCrbJuhzox6KyAG7WR8nA89A",
        "UCR8cs9ybY_J87lkvXfRsqiw",
        "UCsuL3kux1kebu_VsCOKZOjA",
        "UC3ev4_pFjtDekgP7h7nXAEQ",
        "UCU-w8PiX5vsD293v2XtgClg",
        "UC4zYGRnRuxw-p0IZSO4QE5w",
        "UCkSGlG3AKCz8unaLW3uoQOQ",
        "UCfK6FMO4jyVp6DA5oAbu9UQ",
        "UC7JPmdxziPYNtEQAKDBNs_w",
        "UCS8b_WaLf3RgzbAZOv_Leog",
        "UCKNLamB6VLwjjyHWQpQC2Gw",
        "UCrDOti43mZoxP2z9JeFNXtQ",
        "UCgjup-oCkFwHQ7Abp5KJDBg",
        "UCHTVi1FlK_WjBExKwxB-jew",
        "UCLbRqqzfQS4Gf3kMz7TanOA",
        "UCcRE_8_Cq5U6MJpDxyKfXcw",
        "UC73zqrs0Th_a9dFUivEmv2A",
        "UC_yNCmUAJbA7xWRpEY46Wgw",
        "UCosHej_N4lF8fCWTHFrWHFA",
        "UCX35wWxMRk-2bg49S7uy0lQ",
        "UC-j7tR3DhEt85EM9HbvxXqA",
        "UCwTRjvjVge51X-ILJ4i22ew",
        "UC2OyDXkFf9boA-R4tknFa0w",
        "UCPDdt9Iv4cXPEQmyVU_96sw",
        "UCbKWDZTrZuz1yRCHLqq0wnw",
        "UCMyUWL6Mi-2cOPpfjyQV3Zg",
        "UCjrURSwAmx08BCVvZT8shcA",
        "UCEOD71bFpELHcBa7KgqxAgg",
        "UCBAax-WWzmXROoAACbWGHtg",
        "UCPPBot1bmfYLSDK0lk9Tlcw",
        "UCF5FD0t-asRTCtKP67kykYw",
        "UCegwghWDySliAEORgjaZqYA",
        "UCUMkpTtR8g8oDKEyxeRvmqQ",
        "UCXzjdB565NpukhkWtu59dlw",
        "UCtm_ppWxsfRzxaYXMA2bqMw",
        "UC-jq_OD2e2xIcm5RdTrBcNg",
        "UCl30IdoZ-SWnER4JdmlqD9Q",
        "UCADiDtyYMbYZpO28S9pbHRw",
        "UC-z1ubmS-iHMVr83EEwRS2g",
        "UC6KoEColA9GwHHUqOUdJ6PQ",
        "UC2d1eUKNhbyJom7SK_dBpFA",
        "UCWDUCXMtOg9DhbCKDCn9HZA",
        "UCThvSNdgK6kFDg5cttHdvdQ",
        "UCO-UDRlVzoRrHrzq-2sV_pA",
        "UCzz5Ym1uJ7Cn8gcy5B176Ng",
        "UCZB0J8mVXqPe3ej6UYlS4DQ",
        "UCUuXhuYaUp5r1ZuuHPpWcFA",
        "UCyF5AQlKSAm1OP-nX3lBrDg",
        "UCJHF5YfCdLcmqKTL_KSzLeQ",
        "UCu59yAFE8fM0sVNTipR4edw",
        "UCJplp5SjeGSdVdwsfb9Q7lQ",
        "UCeSRjhfeeqIgr--AcP9qhyg",
        "UCoS4iknAwZoOXylPJfoVo8Q",
        "UCIPPMRA040LQr5QPyJEbmXA",
        "UCjnYCUIym8wNRjLtZCc6gNg",
        "UCUtGeBjufNZbnZvgW1f5u0A",
        "UCJHBJ7F-nAIlMGolm0Hu4vg",
        "UCZ_6p93N_kL-k8_597xiskA",
        "UC5SXW8337jcLG0Xp3lHbphw",
        "UCLrjR9vlX2lOmFxjYQKEj7A",
        "UCM3SMB1jINy_NxH1O01z5gA",
        "UC8CFZEHmg6ujiUyhRwrBZjg",
        "UCzk65VKtQ4cpNk-K0AnKSyg",
        "UC49nXZTgQ9jcRVFV5eVxB2A",
        "UCXyfYHdOPLUgxMndSwf9tHg",
        "UCMHgddAvbjRqlCB1bHLrlRQ",
        "UCfrQsDVP4gnqL6uJD0hARDQ",
        "UCkSKjuie8rWiXUrNFB-J-EA",
        "UCONM5nGLgp7i_b7w7x5GrAQ",
        "UC46q-QSvoJz-1iSxPeuOqWA",
        "UCfrWoRGlawPQDQxxeIDRP0Q",
        "UCagQiL8IQ2TChmExU8qWkbQ",
        "UCtbpZEdyGM6xfOaX_rv-H_A",
        "UCSgue5Dm418CCUCZ-aeUtEA",
        "UCsrd__2zNGyuT7WtnrWUwlA",
        "UCvjhJEH2Af7mDMCRNSzmFhA",
        "UCrBGLstQskCRQqds4Ir65KA",
        "UC2u849W-BNFXJUNociHYrqw",
        "UCz-1Z7lJxu2eJsYU5H5_IyQ",
        "UCtVSyE01487a3VIKoqlK15Q",
        "UCtvqb9_-lYp3uzCQnanegTg",
        "UCle4j8ATxCDEQab7U1HfSAA",
        "UCk081mmVz4hzff-3YVBAxow",
        "UCR1Jltq7vMzGQVtRd-DR5AA",
        "UCEJ_TK0g5EVzCc08iMXChMQ",
        "UC4bgtTc82LL_7piX5TzF8GQ",
        "UCaSwC6mrrGofxuKkp-FEX9Q",
        "UCp_42sqU-1QX15nOXpZilgA",
        "UC2kZ30Rwz_c8_BUdeJfMIgQ",
        "UCAHfyrf96qoJWchIKfTh5HA",
        "UC20vnIGa_W4ofoLtKKzhvfA",
        "UCDaJDF-FU9BqAA-qKsH0CUQ",
        "UCXppz8DT6b-fI_9As0p3uAg",
        "UC6XbTRQj_aNClyE04wxrfPg",
        "UCXXNDurQDzF1ojN7mFX9dbQ",
        "UCnTJRksbHP4O8JSz00_XRQA",
        "UCZUcZHd1v4zQwWSf3yqZ8qw",
        "UCL9hvuZXoqx-UKun6pzHq6A",
        "UCz5Pop3xLPXIC6ymO5FWSRw",
        "UCybw-lWV12axzfaHBvcKYbg",
        "UCwJpMb26PtMv5816pEw2D8g",
        "UCtoKGjdpzrXCI_3-WSAs_ng",
        "UCK6ERYApRkUPVNX6pYqxs0g",
        "UC2KpFcpMiYXaomrhQEtx5Mw",
        "UCIP3hSJruPL4dIi95lsuCZA",
        "UCSGoIq_tVESqNYF1Re-zn1Q",
        "UCxpIZzbZjuwvLW7YlvuiuXw",
        "UCZlUAff0s1IbMJlIDrw3TKQ",
        "UC9CoOnJkIBMdeijd9qYoT_g",
        "UCGL9ubdGcvZh_dvSV2z1hoQ",
        "UCGwcH4qnJ2qM_ZJUSFcAMAA",
        "UCwr7Zer6koTU7HajNpq1SYg",
        "UC8bd57XLCxaxPG0ToKo0BjQ",
        "UCGNamOdElTUqLBU7KQSAsYg",
        "UCiJTKr-wja_JVM2dVTYCELA",
        "UC_m71eKCt8ANTVOa1WyikoQ",
        "UCb7B47MZO6lW-Yhjmpb1Ztg",
        "UCIrr4E2y6Cv-2FSxk1_PBGQ",
        "UCoMucmxmJkSpEqNLzs4XMkg",
        "UCmO0uNLXEUKDo2abZILC_cg",
        "UCaz05qpJiFoTomBsYAUdosw",
        "UC33_WA0qWDHF4qhsSihrxpg",
        "UCG-r4DoqaXmFdWKcY9PbarA",
        "UCFyvd9_thzMLomDYQ9h_Ytw",
        "UCrZ4eml-2H5eDjEqP49o4eA",
        "UC5rpPy-LgbGfA5KZw8IPi4g",
        "UCNBc_5CxW1G0OyZsBJHr34A",
        "UCorBWy2Imz8wZTl9cERkpqw",
        "UCfsczESJZtB8IIO_hbXzjwA",
        "UC0oI59VqP0kVlUUmR-AFf5g",
        "UCyUqsKwOoZjLDIvOZXvrLsw",
        "UCGfRQO4oEKsEuITEBTP0x-Q",
        "UCI1EvAIviBYUSrBbzwpfErw",
        "UCrAhzG4rf642oTUCpdyo5Vw",
        "UCbnlU7Uwge6I4gi3_Lh1EGw",
        "UCTih75XU0xbZ3dWsCsbzxIA",
        "UCmUps6NJAw1uouYWav-jKmw",
        "UCk28WO4bKngBT9vl-boV5wQ",
        "UC-vdzV9IVeIsp0YSCm16CkQ",
        "UCYEcRcwNhGS3fAYVrOneFew",
        "UCFcBAGR0drI3F15EhMFjuTg",
        "UCvcqj8RI_z8ll50tdyUSWfQ",
        "UCddxEQncBzkQ6_Dd5sHu1RA",
        "UCLEM53JziPYK0eCBFpgl94g",
        "UC4yFGrMYnnRusraegYMIauw",
        "UCHtXnGD-CoTogjW2F6V4aRQ",
        "UCZtpUg2WzSJq2Ns1Yb785eQ",
        "UCt3oBs9-vZxsGAOR69HeD6Q",
        "UCbggRjngYcCfLvnSK78ildg",
        "UCRZe5j7sBsBt5rOwFh5YTvw",
        "UCnPLh95ri6-GaqbEBwqf9QQ",
        "UCBvcA-f00B4br1ePBysCpPQ",
        "UC0qIGxsvr-D7aI2OiSplasg",
        "UCSyJ1WvirdmrMY8rpnT41LA",
        "UC-GUgUW8i29tz8MrxDq5s5Q",
        "UC8uTc6AB74lyKyZzYf1OUtg",
        "UCLAyXN5Pt5YvsayidRpogLg",
        "UCwRHhTBcrBYhWoWQiuNDAOA",
        "UCo9ZZ04kIhN_8xGxvnjaduQ",
        "UCAbHU5C61UNjwPV8MF5b2Bg",
        "UCZjpQm2tj4u2HfhSNrIYmEg",
        "UCvlce5EgkkuzHW4ez0V49sw",
        "UCY5AtWwU8c1Q9wZW2GxxFSQ",
        "UCKIkUNANaTwB3HvapCH_Ejg",
        "UCTDrjPTc-Q5zDbG86R2TmSA",
        "UCIY1W8g0-hawL8-d-_Y2xBw",
        "UCm4NHRafzs1BtpjWiop8vmQ",
        "UChlzJZpwAHBVpFsC52qPc8A",
        "UCO4N6FkaASQgH3AOUflDMFQ",
        "UCLFeZLuqUIHKpk4OyFnsJvQ",
        "UCsarF6m5dvG89mYAlxUel8A",
        "UCu6wqvHHdP5blW1K05Aj5Pw",
        "UC7zdzncwMm_ha-Xq5_4Bx_w",
        "UCLKlTvJPcIfs2f_wGMnozwA",
        "UCT5nKIO5yP_dvbG45c32MJw",
        "UCSz-V12JWVw-i4csZ7XLJjw",
        "UCghO3uno62u4xmeLm8yxKdA",
        "UCOPHQNERvBprhrYNBUaeT7A",
        "UCC2ZrIpmI6jEUofcObKPlZg",
        "UCv6AZQipetTPIiqooPE_mHw",
        "UCL_bG65D1CG10cxyvdhrQLQ",
        "UCixslslw8PJ9HK8AWGHfUGw",
        "UCGTCz-yT9RkPfxxAQLRzvVQ",
        "UC8904tr-E7BHJp8GgMuO4uw",
        "UCLhhdwJv1E9WICzFXNS23Mg",
        "UCSJ7F-9d351iCvla2IzAQoQ",
        "UCM0a0rB9-ljtZB54m3DLXsA",
        "UCnbslpdDTxNZnpygX-lP4Xg",
        "UCcpEuXY92S8Y6intPAtZYhA",
        "UCL7clRhJV142TtNHIS4qKsA",
        "UCE-8FgcXvnAsb2EG1FizSyg",
        "UCR6byVIT4_QoWMlgfO4t27Q",
        "UCEO0rIuBz8Dc8p7PpGE26ZQ",
        "UCN7fzzGn6XsTqBeewTDbBQw",
        "UCx8uvG6fu2ocH6zOX9dkkSg",
        "UCl699O7CKAq3wxx1UYaXWIw",
        "UCq4rCyhZu8vmEYxHQ8aDAcQ",
        "UChas49rrzl5D06Ccv1NGWUg",
        "UC1teN8fyxq0V-aQ1KvMFpbQ",
        "UCHLqIOMPk20w-6cFgkA90jw",
        "UCIB65_E_7XEScU2NB135wDw",
        "UCNUFterLJ9vpFZZ0try7sLA",
        "UCk5SUJelMVsvP1J7CbkmVYg",
        "UCrMWtvxARfGOBDagqB6zWWw",
        "UChIxlEPgYQGZFPnNCSlbKOQ",
        "UCSf7LzHZcw1yfgh-4rpebKw",
        "UCAIEufoszs1J38-pKECORRg",
        "UCUDQdVsKssximyFwg4IxnOQ",
        "UC93NIQUxTyBGEoSgZSVgVnA",
        "UCJdvOIYS9-M98VV140LRDcA",
        "UCHegfJUPFfTaOz6iCxts2yw",
        "UC2OdyJWgfYY3Y_asp5jYKcA",
        "UCR33pbGbaYJ31Ai5moJudaw",
        "UCxI9BcKGerdPbJuYA2V_xBA",
        "UCDhTv-vteNFycLtx0H2vIfQ",
        "UCNKvJ-v5fCklyatvVU4Sb3A",
        "UCbvdcwQsU2pfQUO9C6Nx6sA",
        "UCpkg5RjtYqjRbxwL9Gf5Tfw",
        "UCVg6qg-ZeFoVHUFSFk7lKGg",
        "UC0gsMYK1dqQ5KqOQfavVNkg",
        "UCwg9Q7CsIVKChcpg28ilxew",
        "UCXOnB_OyEBksL5vW0Ze3B3A",
        "UClzwimpLoZu9us9MwalLbtA",
        "UCyylH1poUi9DDEqA5VaVuOw",
        "UCITAyt7A3CW8u4zYRcAfyWw",
        "UC8YddK8DXYyry_LWY4NksgA",
        "UC44l9XMwecN5nSgIF2Dvivg",
        "UCaszgR2TH3qNw_CxLHAd2SQ",
        "UClDtMswg3muouH60XTKlVEw",
        "UCJb5shn4LSDtcZbBlftCzTQ",
        "UCPO5tvpB9FcYXnJ0VYwYSNg",
        "UCOaBPdgHTuwJhuGKRLUECnQ",
        "UCY7eFg5TEMsk_aTqM0pVB4w",
        "UCXQiJKknQM14uQakw0evifw",
        "UCAyd8kYxON-KM0UuRuK_sIg",
        "UCYH1yre7R1k2dYPaz3Zye7A",
        "UCljt2qY9kRkarl5EYEgkoaA",
        "UCJekW1Vj5fCVEGdye_mBN6Q",
        "UCM1VesJtJ9vTXcMLLr_FfdQ",
        "UC9IQhNgS43lmUdU-KdGyb0A",
        "UCyR7iLc73OW1kuW3qnvGVBQ",
        "UCR6yfDK_u5EXby7CnG9-rYw",
        "UCmDGzVoIXmLOsXK9AkV_UYQ",
        "UCYLIdNtYastlMWbbnWfgwIg",
        "UCVkYbk7C3xPZQh2xr8la_kA",
        "UCatL-c6pmnjzEOHSyjn-sHA",
        "UC8y75OuwgbpvVZ4h60a6moQ",
        "UCtTxVCKtcWepPbU3oricv0w",
        "UCL-5MLklRWjvcehQuVA4xTg",
        "UCEvYfJxHF7j972EwzD09aZQ",
        "UCKJmzY163_v2ZpxxgtgA0Pw",
        "UCeTcV0owT8p1j8Jj-m-8_Zg",
        "UC2GlFUF2pmKxfLPg0xMTQiQ",
        "UCFgNFVvOtVRg5Zgn2xGJQcw",
        "UCL8iBXBFy7WjO_k7Hyr4Nmw",
        "UCHPjDxfGDT5tnVrsPWmsvjg",
        "UCDG87sJkuV44JiS1Dd-sp-w",
        "UCHBS2W6XtcWxxptmj4hsx-A",
        "UCj-e7yp2_-qE-TPritppZGQ",
        "UCz1uezW4jCpyluk8qYVVfgA",
        "UClfMub4nG0xcmaWyB4d7QGA",
        "UCJHtP67CbtRkqrbj4NCRQiA",
        "UCUphZByYfo2rs-lGptIO6uA",
        "UCGlvEctOHAcHNJtTZQaI_yQ",
        "UCuaRmKJLYaVMDHrnjhWUcHw",
        "UCLjZLzr7IoyOtvIpxzKZ58Q",
        "UCHhoX7RCG7ivhGYsP9SSVOQ",
        "UCFQM7TKBzQNlSX7UQZLi1Nw",
        "UCuJAFcj7t_7f5PGWmFR3Dhg",
        "UCFHJ0SQLu3E-nZz6t6QtNKA",
        "UCk91oFc2hY2CdHirU93baLg",
        "UCLeu1XiiNr4WWlSgHygxk5g",
        "UCr6PWILGgMKLQ6rkVszLn5g",
        "UCq8DICunczvLuJJq414110A",
        "UCfUbRhr13XdumUFsFg9iMfA",
        "UCAchxu84FZDzBkWHxyPgjXA",
        "UCPxo5TPFF0YihBvqVWRfSYA",
        "UCNm0lbvHp2XyNcEspTKpJhQ",
        "UClzB2iZ5jPoTNz0S-QU6Wiw",
        "UCrPS2ldNJJKx7MDW9a3s50A",
        "UCcnoT0-WdEt9aSmhLBT6a3g",
        "UC9ENaatcT4tmWWE81y4OOgg",
        "UC--XV6bWjey3o7adn2N95iQ",
        "UC2lQXX3LvPfhLsLVurwctoA",
        "UCGbshtvS9t-8CW11W7TooQg",
        "UCSiDGb0MnHFGjs4E2WKvShw",
        "UCY6KjrDBN_tIRFT_QNqQbRQ",
        "UCqI7ZYqRZKOlggw2_c0TCTA",
        "UCr4rTXIfsJhAOaYOq0iBuTQ",
        "UC1mjG5tycuWVtYMj0XVan6w",
        "UCD_a9w37t75jDDgUv1zovNA",
        "UCEBxCSEN6oeCkIjcctmCzlg",
        "UCKud809KUMIyNhqwuy5JeFw",
        "UCdIKcMwiS2rJonfR9bsQQmQ",
        "UCFUcEK82zEyw9rXs-5xtWrA",
        "UCSwIN9VfuHzSktH1NLBEivA",
        "UCgJSCPHnomr5gz_XBFmtyEQ",
        "UCUKA8ZSm_U6VBqAGGeDh0hA",
        "UC5F_C-1-JmtaGADKR_rDA0A",
        "UCa6sSlus7ogSq_wFYU9Ngpg",
        "UCTjmRSkPhlvRbXd5BptVB6A",
        "UC6ngF2U8nAfJE68GQZ8jxKg",
        "UCugNO83_V7xZLzCsjpABGeg",
        "UCd52AMDwhG4gPMvTM_pDYwg",
        "UC_SgaM1zbb1Mibnsp6J0fJA",
        "UCfIUuMA7U_jImP7oWfTe4Pw",
        "UCNYsIqBwQyhnNDVf7SXJV9w",
        "UC-EwKek1HwCGoyuNxcdkEsg",
        "UCVjlpEjEY9GpksqbEesJnNA",
        "UCF71yDQwxfw0QcYb2JnkB5Q",
        "UCe3OmUXohXrXnNZSRl5Z9kA",
        "UCn0Rrm_fyRvCerGc5pRXMAA",
        "UCocgadotThTV_Zv1KR8V09A",
        "UC-xetw79sX81H3S6xxessQg",
        "UCrqWHfS6e7kIhKSADHVo2lw",
        "UCvcgw2fHnkdThXjE73ytyKA",
        "UCqM7y6jCas4-7_lL6zDSh4Q",
        "UCFihVEClgZDTIs7EkjuRwWw",
        "UCrubleY1bM84nWtccVgvI3Q",
        "UC25LtWxqGLIhb_aPYj_aK-w",
        "UCdKl8xuXvgMFQ08BGn20wgg",
        "UCmKUeknPeD_kzNvIWCqXP8A",
        "UCzIAczNxSUk2VZ71KH2hY2w",
        "UCEWqfxUKLIpqyMzebADGUlg",
        "UCAKxbjXBfld3O3xJaz6ouzQ",
        "UCHhHthKmdBnpB5uwSW6h18g",
        "UCAI75j6HUEqV_0wB6SI0qvA",
        "UC75afuvR06iLKPUB_urtzyQ",
        "UCoUcX00MFHpOUP5yeG_gL5Q",
        "UCTITr-reyUthqdhrSgaD4Xg",
        "UCyN1idRrKgIsJxHqklrETow",
        "UCGInHRs1U8glU_g7sXeOJJA",
        "UCPSXY_Iw-3JpVPn138M1wPA",
        "UCqHv779CDFtEqAVldaxQxcw",
        "UCv_huatIWgOQhBdKIsw6-Bw",
        "UC7pI2wewkvdclXgADg9SfwA",
        "UCuAE5NFewSUWDLVLrrN75oQ",
        "UCP0g48Ktaq1kIvYmjyOh8gQ",
        "UCUasJtYrhPX1SGFVZNrV9QA",
        "UCKqhzrNF77FEpucmlyjNHzA",
        "UCc-4xs6VMv8d-0MS3chsMmA",
        "UCRCWJCFoZUvkkWzIqzfBy6g",
        "UCL6JmiMXKoXS6bpP1D3bk8g",
        "UCng1W4Odmrquz6yBxPgWucA",
        "UCJOXLX2b_uMEct1r5F4PMXQ",
        "UCNtX0x0UOcYr72VN5MHxrjA",
        "UCnm1OOV8ufB-yC7TYsARodg",
        "UC9JKFVQDpHuMAh_AOrhHHLg",
        "UCRMNx1oS1bYpJdkM7KQx25Q",
        "UCgZSAzC8jC9xwLs3Pysp7Hg",
        "UC51DY7a4Ftlmz0puVhQ1V2g",
        "UCLzfLNw3LNQcfafVBv-axVw",
        "UC0u9DbdtdTGHAv2-nebI6gw",
        "UCMkYQ0uutQp0uLfkV8n6s6w",
        "UC1_E4r9e6HDUUV3C1yxgUzg",
        "UCR-5gbEQ3pBuU82w1yMkGoA",
        "UC-V8sabWfXLyWxlgRDwaiaQ",
        "UCpAlKbmqvYeMzV_sDOGNWuQ",
        "UCHfdar1Omym4c0fSqWxQXHg",
        "UClGuLDuraHQvUnUYIdW1j-w",
        "UCjvNXGr4hwaBfjYkI_Mltzw",
        "UCGYIJXnbQEQRmXZcQN2SLcw",
        "UCK72GjkEBqZDmGXapj7AuXw",
        "UC5p0FTpOleZUc87YVJ8VX-g",
        "UCJe3OJhG4gWb5FX38FiMmuQ",
        "UCgnM4WaEeqEZsJ37fAZTygg",
        "UCND9hBoyzS9-tERUK2BKE3w",
        "UCy2z_wafdfwSnDMqnkAJeRQ",
        "UCkN0clHJEaGGQFgKQA4X4YA",
        "UClVZMecYwQUV12kjf4RNXbg",
        "UCF3D1D3RL6z8QJzgc6dtQRg",
        "UC3LwmSVF3KJidXhfoD1GrIg",
        "UCI8DegIWgK51cGakXcf1dOQ",
        "UC1iE3m_Oi4-VmaW3vlt4wDw",
        "UCIDmJXGxcZ06cr8qB90nBfQ",
        "UCaUT4hVQxPcBIufBPe9eFbw",
        "UCoWwkxdJK7F_N4foMT9KsPw",
        "UC3YmP7nqf514I1zh1eVbzrA",
        "UCTxrkaJl3jL2GfGpSpNV_3Q",
        "UC6Ducahs02pBJER2hkHe0bg",
        "UC_a6c3KLo9reMOqn2pbvMqg",
        "UCCBGUffdWwRV0gUqgElkCfw",
        "UCd6TiAWzTgmlEmFrYjh8nmQ",
        "UC_c-RTowPbIlzMkIa_O7s6Q",
        "UCEgBvG3E3HMBGz9WrX606oA",
        "UCNoHgusuqYtE2nXKcXMIICQ",
        "UCNhofiqfw5nl-NeDJkXtPvw",
        "UCAZe84ygGDMhuY55mMBWW9Q",
        "UCbZrXtmcHcj8gwOeXXGdf0g",
        "UCc2oKMZcS_c_zYL3zJdnqrg",
        "UCMujMmCjJYesz92HkhJlW0g",
        "UCVw_YxfI1E6O8QgIgKD7zJg",
        "UC56u3PdLYnGcS8_RVij_N1w",
        "UC7zbTzqS43upbACtLNUCljg",
        "UCkzLWm84xTzh222P-yjJUnw",
        "UCJMD4u4SZZqg9g2wUBSsRDA",
        "UC-WJ1dMBeXR2HNcBU6se_5A",
        "UCg5WB8dYcHD_TQSUtqXombw",
        "UCmxWcR4lnPTA7v2FPY9EZ9A",
        "UCnwY6Zz-FjqJEeD1Vv6K0bw",
        "UC9NCRx4aYm4q5qXmJ3USM1Q",
        "UCW5GkD3nwfvwxLhDdTIJFjQ",
        "UCgsWayzDGwj9CclwicO_R3w",
        "UCfj4SrALOJoQbMkjzB6sheQ",
        "UCgNs5GVvw5Td-05qp22sPLg",
        "UCMWmIxtktDfSYOq6d9EG6iQ",
        "UCXm91_pBJL_KCIbI4fAz6yQ",
        "UCRBpynZV0b7ww2XMCfC17qg",
        "UCG2K7LqRgY2qalPihN5gm7A",
        "UCXvTRxB0fMHTm9NKdOGOBOg",
        "UCMgRn6IUhNMfjnnyd0EbWjw",
        "UCY-xnOGnQPAwOQ_bfHZQliA",
        "UCSQOuXlH4-BwPHHC_f1fLqg",
        "UC2EReJRQgenZyGQyzLhYfbg",
        "UC9nIB8Uq7CPTzFg8zp-hwUg",
        "UCdoLyL3oKt8NFP4f0Wdv-oQ",
        "UCMPReGU_Lvv2xDpzIiObZrw",
        "UCpNmJ8RyNXholtPsHRnT9tg",
        "UCBCQ-YdmMIA_JEaFMS8nqtg",
        "UC6TsLnmtIbNl37_dSkysMbQ",
        "UCbhEe8GjQr0qjX1gbmfADOA",
        "UCXjFt5oIhl6rgmTfkA8x-uA",
        "UChmAsNqxpVDQhH_E-Kphn_g",
        "UCYtjYw6tJ9DLqVlATAdIm0w",
        "UCI8hgpbobTOpO1B4HUJMwvQ",
        "UCkeTA80xeSa9POCGRpWTIfQ",
        "UCuxgEyMeaks7HS5gAw6Tt7w",
        "UC73H5p3GP8b5N1f3hozIXyQ",
        "UCQW2tTNJ40V2T6MqV1eMZ0w",
        "UCVZAfsaiMUbv50gz9TvMrZQ",
        "UCYyBK4xrG6fU_k_fvqe3JeQ",
        "UCe0z1hkojf7OnfPSAxTtVKw",
        "UC0g_gU09pcuMKQM5w6c19Mg",
        "UCBYyJBCtCvgqA4NwtoPMwpQ",
        "UCLDBEDXQDUcchFUCZgMDRYg",
        "UC6WzPg6yxF9dQx2_O6R4lww",
        "UCBXOFnNTULFaAnj24PAeblg",
        "UCx8Z14PpntdaxCt2hakbQLQ",
        "UCWLGiCPFNfs8xft9jXaf_rQ",
        "UC-CSyyi47VX1lD9zyeABW3w",
        "UCpRiMGGX2hM9zqv6FgXXbKg",
        "UC4-eGDvOe41__-RiE0E9L6A",
        "UCfFioh-xDBkzfyFd0F1UR4g",
        "UCrwHV7Ixq09BOfjeyxGwCpw",
        "UCt6Fq64J2rTswe4uhZtxNtg",
        "UCNOqoGVfKTrs4r7oycyDL1A",
        "UCSP9MHFraCeKa7GG0oaGAyA",
        "UCKM3VQFIITaRegPDkLlLeKA",
        "UCz6um3OOL1YTt238tEkZUrg",
        "UCwM4g999Q94nkJr4gC881AA",
        "UCYGpbR5Fyh_F5Krv04aMgIQ",
        "UCRneFUWZS6kMKhwS7wN_koQ",
        "UCGs-yDFkfHDbeQcApWkTtxg",
        "UCu6O9MhKi6m7pgJcchrkxjA",
        "UCawNWlihdgaycQpO3zi-jYg",
        "UCGYZUS-tYBQWnFztK1SO4Qw",
        "UCNDw_brZDdsAhf-ZYIUQ4sQ",
        "UCKDhU-HTo6yA10ULpLEojXg",
        "UCDbeC-XWSTgwJB_adp6fV-g",
        "UCnuf06xsaSO8f2svzMENyBw",
        "UCDPPs6ma3aNvFRiLkzUrveA",
        "UCVhGR9TU1vfvHXl73uaEiEQ",
        "UCxLItlLgwAfJnGwoeQjQxlg",
        "UCusD8A5gH-S-GK9bXlP5i3w",
        "UCQyt2Cf64UPYGwAriwn3i1w",
        "UC-vmL-XrMSD7q7XwLia_ERw",
        "UCiGm_E4ZwYSHV3bcW1pnSeQ",
        "UCJFp8uSYCjXOMnkUyb3CQ3Q",
        "UCsQ_jOhcocGL6p1ESjJQSxQ",
        "UCMFTkqJI6DWYkF0lbpQG0ig",
        "UCF6KgsXF5-DZCuLjkjacPqQ",
        "UCKpFJB4GFiNkhmpVZQ_d9Rg",
        "UCDKJdFer1phQI95UinPZehw",
        "UCfHzBh-vIz9GYIgJWZN7JbA",
        "UCNiQ0gVetxo3HHboCP3UdAA",
        "UCfYkc_JGMgzy-uphVquia-w",
        "UCjpd20VB6J9Ng5fm3EdRHqA",
        "UCH1EiIjp1_PPIixDB2YymMw",
        "UCAehYsG9vyWCVXsfvR3vwaw",
        "UCyn_E0ZE8RNOnYnF3lVaCOQ",
        "UC4coHwXcIzHyRG9DsANJrJw",
        "UCl3EFVV66Io9d4maPaP13Tw",
        "UC95He1BDi6D5Y7JbogloWhQ",
        "UCUa_BlJ3sJl7PH0-bSrryEg",
        "UCoVEe8eHKqxNPPR34_2i_Uw",
        "UCdGhQ412sJCGbpyMPA2pPWQ",
        "UC-7M5mu80uLrzhPd0Dg7F8w",
        "UCboi9tFaUpreNfGMBoZ339A",
        "UCAhFXSbJz9ZLlzSPBQUrDDw",
        "UCiciOsypkXcqSFqSPd-NRVA",
        "UCNFT_eq_QCApMEwCACHto9Q",
        "UCRK7Gj9pqufW13Iz-4wMgNg",
        "UCL01q8aYKuTrHsF3Antr3XQ",
        "UCOe9ZFGDW1JV_Ps-aguJR9A",
        "UCsTp6sImVV9tnkYsEzpjAXg",
        "UCNRubQOn8-WEqm9k8REkICA",
        "UCJphxylPWKKQi-iiGToLTXg",
        "UCv2blCnx3hLsAo4kZd1KU_Q",
        "UCYohbAToXhhGvZONgZ1xAGw",
        "UCG-SYiVLkiMkDOJD-7nsn_Q",
        "UCzi-lHRoixTjQDam-G1geyQ",
        "UCjGMX9TWmk9AXw8zefAZABA",
        "UCB3-HRmisQQBtNUiBWxotog",
        "UCrFT3hrTmGOaSFCDR2WjFiQ",
        "UCidjHvASXTogfkMCVGnFYbg",
        "UChGqu4LdgB_pNVd3tcUcDsg",
        "UCCC6YVIUGEVMe1tRnACoqmA",
        "UCZqEOZGZc-uCX2O3dOFDtpw",
        "UCiqCdyT8eKRVOLvUeBCZ8cg",
        "UCqppmGYhbjm2rBBkL9Bi8Bw",
        "UCg-U6otc4dxq4KlTHpssYnw",
        "UCn-kb9Dx2Ie5xwePZ_hEXcg",
        "UCxbq_rKZz4E8m7XZPLsU9Ew",
        "UC5b9VrPvZJInAMHQrHr7CWg",
        "UCEYr2r_CmVmpn29TJypr21Q",
        "UCFFI_2OF5aYJPBqpc4tYW1w",
        "UCrD2TMRx1wghwoSAO3iNTkQ",
        "UCDIeItPvrwNNqktrj4MQHQA",
        "UCmdI-Y9DGqIUzVXGZ-o1pOQ",
        "UCEpHkpv4_CgZIEadjjOv4jA",
        "UCQeYBLt9lgScTtQqS-4FYYw",
        "UCu0Ft6NyMmkurlfeS4ZhVlg",
        "UC8pOnl4XYXcKfZ_aWBO0o_A",
        "UCSnwORddxZG1SyB8lSxWQGg",
        "UC57y8_BVuW2wXNrxJV23dag",
        "UCfA5CSlYGseqSeOhsiiZTfw",
        "UCZbUmBCkDTXCKUFEgABXC_w",
        "UCAul0b-ESub7TrUCQ01gUsQ",
        "UCXMYxKMh3prxnM_4kYZuB3g",
        "UCfi-mPMOmche6WI-jkvnGXw",
        "UCAL3JXZSzSm8AlZyD3nQdBA",
        "UCivqrRLOUPHxrM_eE8IKacQ",
        "UC6onIGeeoPrCe_rbu08AVzQ",
        "UCXB0UOASLMQiXBv-q0H-eow",
        "UCzs_OSYP2-_5qpSiYbgljYg",
        "UCJgHiutnxkapvAbXIrwD2GQ",
        "UCRMSB9D3U36oTSctp2m8zGA",
        "UCJCywlV7s1sxX1V6f-YNajg",
        "UCTp9j2e0ukhO3KgJLnD6M7g",
        "UCVgO39Bk5sMo66-6o6Spn6Q",
        "UC8ODIrnMABgW32CmiUyrc7w",
        "UCUeKi8sxHy9YvvDaa1Lqwaw",
        "UCSVMp6WbRAZ1Pp2XC1FIRqw",
        "UCVuwvAhd5rSQvX6Dc3UENBQ",
        "UCfbzPobsjKdvUyGfd2kW67A",
        "UC5IvpYlxWhapJgXOisw0bBA",
        "UCPSLqQkRGZ9TS12idypw5IA",
        "UCq4qiifOaFGW3a2oljSfxUg",
        "UCYd0us2OtW4d4-1cfpT2ktw",
        "UCxzJt2_zN9_mnIWg0A0tnRA",
        "UCwIWAbIeu0xI0ReKWOcw3eg",
        "UCRkuUgtDAL4XSU5jB40J_wA",
        "UC5i_p0g9PpE73P2uchfsd9w",
        "UCnXE1snPsQ_hO0QClItbXWA",
        "UC1kcG__InK5PHuNpPMsPWuA",
        "UCcOnjBn7Ylhdp_oyXFyVejg",
        "UC0NZ6zIH1fb4igVjP17ZqJw",
        "UCFhHqMeD-YEtUumC7tQgi4w",
        "UCUQPL34CaQOMxH14XeudIGg",
        "UCbWzWaGembaIceXDiLWl9ew",
        "UCSJjVGgvKI0lLcmNCLAEx8Q",
        "UCAyyBovmq1OZsUGljpD86QQ",
        "UC_AnHdImYQlXTldob8W9ldw",
        "UCWntU26S-6vSHt3HsSQbZ1Q",
        "UCBJO-1gbLAileslKIsWGMHg",
        "UC15I8-RN_qRlT1P0jrP6LuQ",
        "UCI6ELghteE2iINHC6Ufe5ng",
        "UC3EGfP22m0kYvxudJoPcqGQ",
        "UC8W1G6KxaibtDVlSjztBDKg",
        "UCTLnHVm5neCapskaL4P7m1g",
        "UCqtmh9l1kQhxDkvqQj0geqg",
        "UCPbE8UztMtGa24hlvzYQpzQ",
        "UC6J_1lbR727yUrcm9m140Ug",
        "UCVkBJL5y_Oezbo07MeL4i4Q",
        "UCtUwuQWQ28-1hgSSovYEnrw",
        "UCgffSD0hpI0nglPAV_77dtA",
        "UCtS-ZciZCl-dOP2jf_p9xig",
        "UCbAJhvVfmZ8EDEuV7-CHOBg",
        "UC0ZqpSq-OIpOITZ7U16-Xeg",
        "UCj7o9mtW6vvRGQPjjkTSykg",
        "UCyoSQyaCrZHro6F_nBiXIYg",
        "UCBA9XaL5wCdHnC5EmEzwrqw",
        "UCO78BQwAIG-pEfhgJEt-VRQ",
        "UCL2ZLyAV0H9Pvi46W7TGdHQ",
        "UCDmpY3ukz9BI4zS56fG-Y7Q",
        "UCm8lL-mYL_3seeaf7JUXNwQ",
        "UCf-k_BU6RbS42L7MJXzovaA",
        "UC7e5oAresWJW6LOyygdSUXw",
        "UCugz3-UlkX2P77PtK1Ju0RA",
        "UCwKSt3hca-BT4r0trEgqBjQ",
        "UCYmna5rFHIesFteksAvFOfg",
        "UC530F6WbefZuTdM4jI42gUg",
        "UCKSZiGvRXrjRUoOmlhCgdHQ",
        "UC-IwUE1lmCEawU_nvsanzIw",
        "UCj2vpYQcNpNx4YfQ0zGOI5w",
        "UCV0x4RSwwxfMXJxjrl2UsOQ",
        "UC5r7YWb-08WxxTXU7snBVUA",
        "UCm3mcJxZuJTHiK_lWahv9kQ",
        "UCWPfE_CEayzBNJcMXztmuyg",
        "UCbGr96BQqKP-0xHjKc3q9jg",
        "UCAbQrTeCeJnx_7CxCc0djYw",
        "UCzebKP08mRume5zEiE01Frw",
        "UCNZDYKNwAVhzNQ21EB0ZRDQ",
        "UChNgohjQU9tW28_59jL9Y3w",
        "UCC34uLurUBx_pkoB04nOsLg",
        "UCSso6ynLza_BKtcqMDzK-MQ",
        "UC2WW6F3nmGR1n19RHVqPORg",
        "UCCjfbcoH0ZYT0r1jScDHJMg",
        "UCFQMnBA3CS502aghlcr0_aw",
        "UCF210wfiAt4jvfCxW4sSXaQ",
        "UCY5WC1pD89U8qGUOrF1zXuw",
        "UCbvdwZvZgdl-pPyomEmaEfg",
        "UCSuszavwTcfUboVfnlbL5wQ",
        "UCRe2Ir9wtPk_YQjElam7n2w",
        "UCEzDdNqNkT-7rSfSGSr1hWg",
        "UC-acU3o9BHJ0SunMoHy6vBQ",
        "UCbgiQf5_LZnyYLFCPeYlzKQ",
        "UCe-yXpdl-5F4xOZYP7ZN2tQ",
        "UCYPs4y5esNqx6ax1CxZws6Q",
        "UCp1BHFaAFEmO6WbkD9hEoAw",
        "UCACYsENwrRKKPPtH6CYcYKA",
        "UCcrxM67Be0UndvcKVLmz4HA",
        "UC23hGQoBuy9Obl2wBEHAu5w",
        "UCM9zWJTrU-B5lEALT880wnA",
        "UC0gyg4cy-U3fcTrVdMCtxZQ",
        "UCWyeJ5Hr9budyD8kyDkru6Q",
        "UCgp4A6I8LCWrhUzn-5SbKvA",
        "UCCPdaEIRiXJlq2EZvI3FFUQ",
        "UCBzu4YqGiBxBD8pq8NiBuKw",
        "UCjV6LnXFtXzWoYxnq-zIvXw",
        "UCZKlshRTh3H4pRXa4N6458A",
        "UCDGwg0flJkk3LNjd_6lQUjA",
        "UCeGNFns1dbiAVjIemvcXTSQ",
        "UCg-nS6NlLNLem_3reVzEYAg",
        "UC3WbsYPpyvqGtEWMHCKf_qA",
        "UCeMoPD4wqlfUQVZ7kiaAf9w",
        "UCoWLMUajCvF9HNaUEYJx1Sg",
        "UC20Wx5hNQQLCh4qS4siNBtw",
        "UCF2IdUc9u6Cd5kpPFLCZJ0g",
        "UCmmuopMJDTxPDB31v8W-sSQ",
        "UCl6ICaB9meBcSMQ5Zmr446g",
        "UCZ319ilhp7CYgkWkmXPoccg",
        "UCbxud_mmyLzNUS5QKMNPwFQ",
        "UCJkmgfE3v8j80W5nX6EMqFw",
        "UCdfcCjKs9MTvzJ2AgVyQkXA",
        "UCHphq9udrisoGYguDx-cKoQ",
        "UCohHBQeoDjSd3U2N3Kg8OBA",
        "UC7MXLI02Z0VzYtklqhwsQlQ",
        "UCkZXUwhApHbjGWeuBNY7aiw",
        "UC40f7vS6lkadXXOxegBIfCg",
        "UCXnQd2BXfu7MJ10gLsc1Ahw",
        "UCYhLgzBq5dZUXn2tgxCIlmA",
        "UCK178jxp25jSJd70-KmCfyg",
        "UCvXzPh9oJitBU56KgL6OtiA",
        "UCMMmy64_0rySSPUu0xohuCQ",
        "UCs6eXM7s8Vl5WcECcRHc2qQ",
        "UCiqAyo_20QEIsY8hBN-ITAg",
        "UCKBaL17hXLGJvi2KZKpja5w",
        "UCrl_2sLa2nNJgX9PDZ8FSCg",
        "UCtZFHkunD2rqRiS22oJ3vXw",
        "UCovOOANLUf2bec5ddjtSngg",
        "UC9dWUAEk_394qNrIV-oA6Kg",
        "UCX3IrV7uIir6yzMM9kOtH1Q",
        "UCqBJ47FjJcl61fmSbcadAVg",
        "UCPemo8Jnc-JGG_xIN3-TCBg",
        "UCKVsdeoHExltrWMuK0hOWmg",
        "UC6QjtrmjCTrDFGG62GE4KZQ",
        "UC3Tj_9aKhQnqJhxLvyC-KdQ",
        "UC8OFFRbUn1axWAGqX5Sw4Zg",
        "UChBQgieUidXV1CmDxSdRm3g",
        "UC2O6vD7gjgZIXKVegD6qOHA",
        "UCuNsouEfEq9Sh6tapfg4uRA",
        "UC_AUSlwRl5dH9sDeRdVJ7yQ",
        "UCCtSJrR-qSqt7geJsRNoZSQ",
        "UCk3buHLJP6KAcbtsw8fj4hg",
        "UCYgA4AOMCmg6vepDmkcOEgA",
        "UCaReWkJrSaXclC04chzppdA",
        "UC6bdC9zbCM16VymF2b51oJg",
        "UCuU1RZHNthbNCS-qhYiLRWg",
        "UCqYkaHQFrorRCAj2WgH-G5g",
        "UC1EALOoYjviTgAakJ-phJFg",
        "UCZMsyzbj55s-BRYLqtBg3Fg",
        "UCC_spbdWpbvV4sGX1awXG-A",
        "UC5ZOSZ-Bpass2ZkJY9q9ISg",
        "UC86suRFnqiw8zN6LIYxddYQ",
        "UCZRJztqJLG3jiT-9BCKyi8g",
        "UCKuHFYu3smtrl2AwwMOXOlg",
        "UC1oFVfXdJy1g_KN8GXWghww",
        "UCVn4warYFHUopwaO4uR--jw",
        "UC4V3oCikXeSqYQr0hBMARwg",
        "UCUPa-gJcbYG9Ql8b9H9FBbg",
        "UCvOVRF5upxkGhrdz4jgC4ew",
        "UCBigMkCqY9jBSyOrh-MdDoA",
        "UC8EOv6UDiCgu-qGwtObAdIA",
        "UCLJcPtF9ylShScEeyKkWAng",
        "UCYZKE8AlxOR04cz6o0rEUxg",
        "UCXShrwUf6EFSnYeRlVJuMXA",
        "UCza_sEjIhb1yhvVZEdEl6gA",
        "UCcQeukUfWMChWeq0jkdi5ew",
        "UClKWDOLBMUZqhEyQIXs9Qjg",
        "UCtxfPbmvouoKr7lZmgAUCHQ",
        "UCascSEF2F-EzDyMC7sqECzw",
        "UCXGt7134NOG1mgS6Ox7edtw",
        "UC2xBlbRMQz72aiup99igkQw",
        "UCjxBMDVgTn_VIFU_VX3w8yg",
        "UCFqxdNg47IYAxlX17GTm-pw",
        "UC8fMRymSW9G22H-JqH1IVqA",
        "UC7mSxFopUlBXKPd3HZP15kA",
        "UClkUW-qy4n2YCsQsdxE8LNw",
        "UCnJirAlgX6nnjbFtOjmLAYA",
        "UC-LQyvrwEn7kVsNSem2ZSuQ",
        "UCBQylGL1gkjpyIuty-CKKrA",
        "UC1DPUUGY08ttJ9fS9_4JL3A",
        "UCQd7j5Fw-jCv4Uj6wN6QpoA",
        "UCrYJpl5oC2ItVLPub5LVpWw",
        "UC-IUAwcRzwxZZaMz7eXQAXA",
        "UCjsuIwGVcbyMU60tqrOXVVQ",
        "UClAJ7x7nzKyRWlytkz4LOnA",
        "UCGUMatOHuYVzL0qkppoKf3w",
        "UCElqQlsab8XmZsKypLYSzEQ",
        "UC9gW47NqzI1x7e8qsflvUUw",
        "UCRLZWPMWyl_8AWgC1W0W6mA",
        "UCunYbI7emBHPkaeZRvg7eZw",
        "UCMki_UkHb4qSc0qyEcOHHJw",
        "UC87V6XKHlJwjHVZ3Q9kwAig",
        "UCOrATmxTS5W1n_ZDm99Mhkg",
        "UC-6czyMkxDi8E8akPl0c7_w",
        "UCUkSBEJC33xb-WU-pRimdkg",
        "UCXdEu0yCFd0qBFiDvh6FDBg",
        "UCtDAIVlTPeB1L9CORifGS1Q",
        "UC9LyihJZyueIntYpA34E62Q",
        "UCOSAxe9VorRDER8AQsLSFDA",
        "UCmEvAeXHhvC3MU2gapf19HA",
        "UCaJWc8empFPrQKwvSq7gQQA",
        "UCqT_di4IRyb7yJC5kNxyKRg",
        "UCeseHPP6FLZppw-oz9GGeYA",
        "UCrvMTyERN1XmrTlJ0meIWRg",
        "UCNhon6gS4I0TxegNU94178Q",
        "UCRmRqmB5uzpx7wWYEVVdCNw",
        "UCCMv0E4AAng_9jRor84sblQ",
        "UCqUBzXZGPnkzSgcpUHskXpQ",
        "UCV8ZEJsjKZL04y65BtCVe1w",
        "UCufv3rcCBSlFLyOBQjBbJWw",
        "UC78U_45MIF6c254dUaslikA",
        "UCqzenXybTeVcVdes4euHAQQ",
        "UCG8rbF3g2AMX70yOd8vqIZg",
        "UCBjUPsHj7bXt24SUWNoZ0zA",
        "UCKolH59htUIgUCf7HqjvVrA",
        "UCQIUhhcmXsu6cN6n3y9-Pww",
        "UCop6604O_QwmEum6e0Riz2w",
        "UCGdYAG7CagbZZwceRWEnbhQ",
        "UCPkFbYejq7f8M7J1fIB1COA",
        "UCsMHTDSfdkbzPGriziwvdYA",
        "UCdNUXhn-lXf1bLpZBbqm5HA",
        "UCN-HCXEpUHA21v1mc4tdoTQ",
        "UCZDzO0oQupXE05RDejbzjpQ",
        "UCsM9FcsWEkPc_EYHsk3DQHQ",
        "UCf9KXP0sFR827ita1oimyTg",
        "UCDfsm8hWcuPBb76IL8IFSvg",
        "UCZiGGE0e0DctISlShAILbjQ",
        "UCQ70QG-rx8pZrTtK_ifTwFw",
        "UClCufEJK0FvBiMzOyZWV1ng",
        "UCZgGGDqx7olwGyzuETo8Vgw",
        "UCpLY0WWaD8J_5WRs4z0pM7A",
        "UCBYKpQrCEIO0bAIkXqy_HCw",
        "UCtgTrj49wi_GrB3t1d9U8Fw",
        "UCOATh0c7XY6iSW0cGrbeq6A",
        "UCSIJHn07pG1P2rNBSqUWU6Q",
        "UCyt3sQ-XY4NZ2XpZnaxyQQw",
        "UCiupqJgXXT-2ESA7xjAJ7Rw",
        "UCsQBqzL0XAGcOWDXkNWqvZw",
        "UCcjtLv_tGe2Rt7YHRkFH0Mg",
        "UCb98d93A6-l1qYwmzTf9duA",
        "UCFaF36k_giQEw3aSe1NF3SQ",
        "UCAFoFcvJVn9tn3j1Mfqwi4A",
        "UCdOtFMxENK6SHnibst2uOOw"
      ]);
      // 중복 제거된 배열로 변환
      const channelIds = Array.from(channelIdsSet);

      try {
        // 런타임에 환경 변수 다시 읽기 (Next.js 서버 재시작 없이 반영)
        const runtimeApiKeysStr = process.env.YOUTUBE_API_KEYS || process.env.YOUTUBE_API_KEY || "AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY";
        const runtimeApiKeys = runtimeApiKeysStr.split(',').map(key => key.trim()).filter(key => key.length > 0);

        // YouTube API는 한 번에 최대 50개까지 조회 가능
        // 50개씩 나누어서 배치 처리
        const batchSize = 50;
        const allChannels: any[] = [];
        
        for (let i = 0; i < channelIds.length; i += batchSize) {
          const batch = channelIds.slice(i, i + batchSize);
          const ids = batch.join(",");
          const batchNum = Math.floor(i / batchSize) + 1;
          
          // 런타임 API 키 사용
          let currentRuntimeKeyIndex = 0;
          const getNextRuntimeApiKey = () => {
            const availableKeys = runtimeApiKeys.filter(key => !exhaustedKeys.has(key));
            if (availableKeys.length === 0) {
              throw new Error("모든 API 키의 쿼터가 소진되었습니다.");
            }
            const key = availableKeys[currentRuntimeKeyIndex % availableKeys.length];
            currentRuntimeKeyIndex++;
            return key;
          };

          let apiKey = getNextRuntimeApiKey();
          let attempts = 0;
          const maxAttempts = runtimeApiKeys.length;
          let success = false;

          while (attempts < maxAttempts && !success) {
            try {
              const response = await fetch(
                `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${ids}&key=${apiKey}`
              );

              if (!response.ok) {
                if (response.status === 403) {
                  
                  markKeyExhausted(apiKey);
                  attempts++;
                  if (attempts < maxAttempts) {
                    apiKey = getNextRuntimeApiKey();
                    continue;
                  } else {
                    // 모든 키 소진 (에러 로그 제거 - 성능 최적화)
                    break;
                  }
                } else {
                  // YouTube API 에러 (에러 로그 제거 - 성능 최적화)
                  break;
                }
              }

              const data = await response.json();
              
              if (data.items && data.items.length > 0) {
                // 중복 제거: 이미 수집된 채널 ID는 제외
                const existingIds = new Set(allChannels.map((c: any) => c.id));
                const newItems = data.items.filter((item: any) => !existingIds.has(item.id));
                allChannels.push(...newItems);
                
                success = true;
              }
              break; // 성공 또는 다른 오류 시 루프 탈출
            } catch (error) {
              // YouTube API 에러 (에러 로그 제거 - 성능 최적화)
              break;
            }
          }

          // Rate limiting 방지
          if (i + batchSize < channelIds.length) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }

        if (allChannels.length === 0) {
          
          return await getMockData();
        }

        // 국가별 채널 ID 매핑 (한 번만 생성)
        const countryChannelMap = new Map<string, string[]>();
          countryChannelMap.set("US", ["UC6XUug9NifWGWcL86YYeYSA", "UCfpaSruWW3S4dibonKXENjA", "UCuK80YHBZyyKrr2B1oHrgrw", "UCzhWBbuill_QyCG2W1M1iaQ", "UCY1kMZp36IQSyNx_9h4mpCg", "UC9k1vn9ErCoe7JngU6SubVw", "UCVV9-BZ_8EybNWtbvnF8DHw", "UCC6TthHceFnoys-ZDT8svTQ", "UC1LWEy4e4tudhEzMwjpBdsw", "UCCZ-gBdN59pF39tbm16xvdQ", "UC-Jp4WHCXhxvWQ5Ab4JibJQ", "UC_pT_Iz6XjuM-eMTlXghdfw", "UCTxEJoeukRCeE3j74tZjrAA", "UCkgDHJNdiidw67LAAVooc1A", "UCYfbq37VGb-07tDS0FGtsPw", "UCVzLLZkDuFGAE2BGdBuBNBg", "UCpVm7bg6pXKo1Pr6k5kxG9A", "UCDwzLWgGft47xQ30u-vjsrg", "UCx27Pkk8plpiosF14qXq-VA", "UCAuUUnT6oDeKwE6v1NGQxug", "UCgM5P6QGHmrvu5fDPx79mug", "UCXw1ddyrUmib3zmCmvSI1ow", "UCx6h-dWzJ5NpAlja1YsApdg", "UC_zEzzq54Rm0iy7lmmZbCIg", "UCQANb2YPwAtK-IQJrLaaUFw", "UC2fsxQr6Hcx1enORxXgKpxQ", "UCNnwmqZOxSuOiF3_c7mAGWA", "UCvrOll07bwpNzGhBHRB5_yw", "UCMupe3fvv1-Hi3SRxZzSsTw", "UC_JJ_NhRqPKcIOj5Ko3W_3w", "UCkertRH22emvpswtwcXdOxQ", "UCLNrdUoW2HhoN__dpRd585w", "UCHpGooMnVgnILywqrpqvZcQ", "UCVHZoKQu9Blud8PafEuMGXg", "UCimaE0rnOXGdcjJ7YULuM5A", "UCU4AAbkc32kiyHfHbxqKZdw", "UCu5FbwzTQGycs_lWChSOwoA", "UCibo107UgpabxGBxEa6ixqA", "UC_Cprc-ruVm1GS0yPvqy14w", "UCM_HKYb6M9ZIAjosJfWS3Lw"]);
          countryChannelMap.set("CA", ["UCq4LIfDiEHlD6Q3xxYoXvJw", "UC5KviVfpd5mc_kHXpFhyJUQ", "UCIwSHyGTwA18EBS0sfRbi-g", "UCe6eisvsctSPvBhmincn6kA", "UC2hwwXiVc9v3F_U-kGQGcUw", "UCcrpFRRYkH185Xb8D-JQT7Q", "UC0JJtK3m8pwy6rVgnBz47Rw", "UCONd1SNf3_QqjzjCVsURNuA", "UCHUZl8Y-Kc16T6fV_KDpKGQ", "UCfpCQ89W9wjkHc8J_6eTbBg", "UCMl6pPuV-d12pbgV5Ugugjw", "UCQZqallfmfjyIQUjDwZAAzg", "UCbAlVnKhbGLK78GsSemQXxw", "UCu2D8oEJ34Z6XyS82ruupmw", "UCOdKaYgvLlPuinUJ1z5Gm2g", "UC-AQKm7HUNMmxjdS371MSwg", "UCK461o-vJ5o5VZ9Kvm1giDg", "UCLxAS02eWvfZK4icRNzWD_g", "UC4ijq8Cg-8zQKx8OH12dUSw", "UCoC47do520os_4DBMEFGg4A", "UCeikp7aPCip7YW9tCA3ilBg", "UCBFs9KDo_f6T8Ro3wxvwnJQ", "UCX6OQ3DkcsbYNE6H8uQQuVA", "UCtU2-cpxx18iQ4BvracrxDQ", "UCRXJaBvhynZMqVCbHVkzkNw", "UCA61H4fWOMHikLcUFKyQUog", "UC8B7YycFMFQr540MK7Qe0CQ", "UCL0u5uz7KZ9q-pe-VC8TY-w", "UCMQoQC-TZoH7UB-IQjnF6ew", "UCuFFtHWoLl5fauMMD5Ww2jA", "UCdkRHUK23hW7Z8woZOLKtsA", "UCK8qVjkRMI1lRcYp6_W_1qw", "UCG_ZH242vja7O_rsxKMB-bw", "UCN5_WsFn-djS1r2Dl6e0seA", "UCzyN6CC8DbTtEgjr5mAsGvg", "UCOnCNCL44c3aWzhEhyQz09A", "UCxF3OOt7mSHSWRleJ8g8iFA", "UCrH-ZP24Fe4fp6caIETi7sg", "UCKBoJpqzOCqdIDUI3Bpg4Hg", "UCKs7gT8rAcPllB_H8dkVs1w", "UCFdWUBEzeNEYp1SHMmYUkIA", "UCUGbWDYeIQsCy6Hdcsgmq0w", "UCyvEONnqE2Krm9Zi0LVvGmA", "UChojGgtJd_Rlj4sqkiSIpPA"]);
          countryChannelMap.set("MX", ["UCMKiEAHkOTaqvy68nduSkTQ", "UCDYetMc6gOLkhIiNzFyrJPA", "UCicv75Se8iS6otnQJ_4Pa_A", "UCe1hlvtryjtpNL7b0C3c_iA", "UCvHRfEKlMPiebqNarQynRPQ", "UCL0bN6THhHVBwRPsXKOhAHg", "UC8id8PPmTd6aqfpUnQzUaxw", "UCbdpQVwM6iyAe2VpAnFTBxw", "UCNbwAysZuJmp15FE67O_9qA", "UCcUcfEwyDXBMsvYfoOdK7SA", "UCHAHRlgflciksI_DVB58C4g", "UCmh5gdwCx6lN7gEC20leNVA", "UCwVg9btOceLQuNCdoQk9CXg", "UCQ-l7aassFQZnFDny-1aRhA", "UC8JLtamR2_3vRYqDkgIQ1eQ", "UC-AQKm7HUNMmxjdS371MSwg", "UClWD8su9Sk6GzZDwy9zs3_w", "UCEYLdM2bdhmw-TS3c0TjFNw", "UCKyU-wd-KY4PMOcOpPQgQcw", "UCamdvUq4-BoneYsHZt0Agrw", "UCYHnYO50VV8SzsmQq5PChRA", "UCg3gzldyhCHJjY7AWWTNPPA", "UC5BJDVr4m9QEzQlvy_mKGsA", "UCRXJaBvhynZMqVCbHVkzkNw", "UCYfbq37VGb-07tDS0FGtsPw", "UCtPrkXdtCM5DACLufB9jbsA", "UC0JJtK3m8pwy6rVgnBz47Rw", "UCAM2fyCjEdROyELretVTiiw", "UCsBoKLgnZSL0mI7C6tk0CjQ", "UChpxj8crPj8pdYQMOzaTgeg", "UC-U7jRRifYpmsflQibd7k0A", "UC580DuA3ghtZZkjnLh2TIEQ", "UC3mPKT3KX9ysgEqgUrCM9ZQ", "UCU_ziJAO81YhJZ77xor4vfw", "UC13wolbi9fA65ENzPye128w", "UCFrpmQLyAdTssO8CTuE4VSQ", "UCEL83AUr-SB29Z2UqWi8cGw", "UChf_AqFgcaj4s_WM9R1VhpQ", "UCdBiVWf2rT6pjn0R2uUWi6w", "UCux2-yFG8iEnTMexVeSsgXA", "UC4hYGez5Qn40KKmPLWhjraw", "UCfcN-XHBfAreS-hHbhvCfhQ", "UCOpRwrHA7yYdQbonYkQ436g"]);
          countryChannelMap.set("GL", ["UCkYVerz4P_kAZNbDdg2SAeg", "UC1yXC_D3x3u9vIQKngL356w", "UCe6eisvsctSPvBhmincn6kA", "UCBINYCmwE29fBXCpUI8DgTA", "UCZ9lCUhUOUrwqVJmfBkN92A", "UCyEd6QBSgat5kkC6svyjudA", "UCF2ltLX1dnPa6-L1paPaMzw", "UCt3mMVAyGhwQb_ZBGp_p85g", "UComwL29zYKujb1JhkB0EcGA", "UCaYGWwdIj4xuDIW5vOzr8Nw", "UCkhxWF5CTMUgxneqAFP96LQ", "UC2Uioh1tYQkNuHLSBpzdfCg", "UCHYC82sO4Vpbdp_G2LZfIUA", "UCR9Gcq0CMm6YgTzsDxAxjOQ", "UC9h8BDcXwkhZtnqoQJ7PggA", "UCnQC_G5Xsjhp9fEJKuIcrSw", "UCR1D15p_vdP3HkrH8wgjQRw", "UCb7fZdCnbt3AqnjgoNyT6UQ", "UC-CBQChrXvLzYc9oxpMfFPg", "UC7aE3x6TKbWLjngju6KdGnQ", "UClp6eumhT0_zbFAbQTwMNow", "UCZ1eCrCHm7IGNMPx2g_Wo2Q", "UCFMiVtfM4eWhPOMrMWrowtA", "UC9TyctkYTsRUmCX138l6Dug", "UCAG2n6_aj7v23Vrk7-h5Ocw", "UC-Z7UeLrYK3LG41dK6w5Y6g", "UCVEeHdpCjzcffcROCdRrVQA", "UCGi18LVfXgTJC5mslXq88KA", "UCPkR6At4SGY-zvhAMrFBExQ", "UCfs_kJf9EeyC-e2QN2q8eUQ", "UCg40i9L7DIy8FTPdttL_Lxw", "UC2QzIF-C2uTmKWGEEy6DFTg", "UCvKyQnhB5gvaMnEYf64BIYA", "UCzYy2DMdRgELLGAJI12_gWw", "UCBcW1jAsEnkjq9gQ7tuOhsQ", "UCPoRFmKvuJabaFEHah8se5Q", "UC5z51_WDY79adLDoOGXkxKA"]);
          countryChannelMap.set("CL", ["UCvHRfEKlMPiebqNarQynRPQ", "UCpT5HSYOxNtCU1PDa05h_fQ", "UCGAmpBtWveYp0-3v9npnhvQ", "UCGaY-T4e806HmdHzlXEcP7A", "UCsWHNWy_IVdlW0dx9hFTKeA", "UCaY_-ksFSQtTGk0y1HA_3YQ", "UCV4pE4z7qVEwkxbmqT36gdA", "UC1j2bFSKKhyl1h3IB05A-hg", "UCCrA8ZN1J3S52wuF4vthZFQ", "UCL0bN6THhHVBwRPsXKOhAHg", "UCNyv46EnCgc9hT7EWUXBuPg", "UCymE80p2pHiTP4Xye327CVA", "UCTqb7oZzCYpzOhPenq6AOyQ", "UCCm3xDalujG8RHrhdTAZlgg", "UCmFLlkYNixVhaXSppSKvJCg", "UC8EdTmyUaFIfZvVttJ9lgIA", "UCBnbnH7DGXT9yBBVFbZeIwQ", "UC4ijq8Cg-8zQKx8OH12dUSw", "UC2-zLDHEP2rEkqwgutb2ctA", "UCWVBfvVTf3UrPA-z5gos60w", "UCqDZJlfBGMSq88qjipRQMGg", "UCSJ4gkVC6NrvII8umztf0Ow", "UCucot-Zp428OwkyRm2I7v2Q", "UCs_ineLBnNTGjrArNzjSLZg", "UCXw1ddyrUmib3zmCmvSI1ow", "UCVrK_pMRp_q8IelpfUCTGLQ", "UCwaNuezahYT3BOjfXsne2mg", "UCnSWkrRWNQWNhDusoWr_HXQ", "UC-CBQChrXvLzYc9oxpMfFPg", "UCBElRVEL-H0eDYdL2mb1Sng", "UCUcy82tGagXlj4t1p2todeQ", "UCoTmO7BjkCBRfcg0heLJoGA", "UCXDVYRTVWkr0MKgOrzoKJeQ", "UCaHJTioQFL0QjT-fxLudIXA", "UCKTHHyXugRBZQHG4n1nLpcg", "UCTXNz3gjAypWp3EhlIATEJQ", "UCaVaCaiG6qRzDiJDuEGKOhQ", "UCc3Z8yEY-BMFDi9OktYnZZw", "UCnIn4o7pQO5bamsH-sN50AQ", "UC875v6TOQR-sLyED-jfZp7g", "UCpOAcjJNAp0Y0fhznRrXIJQ", "UCrKZcyOJVWnJ60zM1XWllNw", "UCGHoBo9vaN38gyhMUctLP-g", "UCSs2ju3Zwmk_PMl5JvSvuUw", "UC4hxr4lvd_C4ACiZTp55Kzw"]);
          countryChannelMap.set("AR", ["UC8t7S1o1dzvr9j1_idpVTSQ", "UCX2q5DXuYbaVYRdS4oucBtA", "UCAolsolgHiURrQBuZ4qe0lg", "UCvsyDNxVp4PVkOzYvuYGd3A", "UCaY_-ksFSQtTGk0y1HA_3YQ", "UCbdpQVwM6iyAe2VpAnFTBxw", "UCsf7o62bd1t0zy8csOPm1xg", "UCsWHNWy_IVdlW0dx9hFTKeA", "UCP8bmhXTdZXV_nr1jWen7aQ", "UC3SGtE1HWUj1JdhDJWEJW1A", "UCh_bnz4PJzcgCVvrRs98qqQ", "UCYydV0b9GawikL_L5b2yt-Q", "UC42egnZeU-1HYvXNvIAqU0Q", "UCLry9Jqd9cwdQCZ693eV_YQ", "UCaXa-12BiC7gHaggyMqa9IQ", "UC0QKe0NgW-b0oZvnB5vqiJw", "UCYLNGLIzMhRTi6ZOLjAPSmw", "UCLZLfy4DVTfpBpylslR_OPQ", "UCxuYPUdTZHRZKVRZ1km1plw", "UC8EdTmyUaFIfZvVttJ9lgIA", "UCT9zcQNlyht7fRlcjmflRSA", "UCBElRVEL-H0eDYdL2mb1Sng", "UCzUjeR-Wgr0_iyL_brgx3Fw", "UCcgqSM4YEo5vVQpqwN-MaNw", "UCzrM_068Odho89mTRrrxqbA", "UCmBA_wu8xGg1OfOkfW13Q0Q", "UCs_ineLBnNTGjrArNzjSLZg", "UC4ijq8Cg-8zQKx8OH12dUSw", "UCqECaJ8Gagnn7YCbPEzWH6g", "UCWVBfvVTf3UrPA-z5gos60w", "UCStm2uvQKowSXrnCzTWAn6Q", "UCUT4NmGqjrVpKf2JyiS_bbA", "UCWepqrtrANMkbeoBMHxNbOg", "UC3--W-uc0yx77DO__lWJ05Q", "UCEc06N2Eht0eU4CH-zMNJwA", "UCs231K71Bnu5295_x0MB5Pg", "UCI5RY8G0ar-hLIaUJvx58Lw", "UCmibAd-n_BKSDiHfLrhEKpw", "UCxvgCfFc5QazfUs8QB6lg9w", "UCXtUpVdwm_2p5DE9DjfDQYA", "UC9w7aOZMl9a1l9boy4Y-xGg", "UCNxohbqfDp8YxW_Mji2XMHA", "UCGzRtagL4BHepvMzrJZTfZQ", "UC1bBjOZieJWHbsFA0LwjjJA"]);
          countryChannelMap.set("UY", ["UCaXa-12BiC7gHaggyMqa9IQ", "UCNIz8BSPZeJayWDiMYPk5lQ", "UCpUuQKx3gP_iHQe2N9Mkmzg", "UCWjgg6SMQiSQY8cUjCm2skg", "UCYydV0b9GawikL_L5b2yt-Q", "UCp45ocV_A0ypI_iC2KuPnoA", "UCaY_-ksFSQtTGk0y1HA_3YQ", "UCD2w1rGcJc99akNKluz_FDw", "UC0Ize0RLIbGdH5x4wI45G-A", "UCba1vMvOHWlMddLARS382Zw", "UCo5HJNjfdSoPWsdAHLsvSxQ", "UCMIBUhL2pb_wPFPoeJ5MWBA", "UCLWCLAx6Gbs2J75Ts5IAiKA", "UCCrA8ZN1J3S52wuF4vthZFQ", "UCHUD6A_lv3OXbzgVXwomtkw", "UC8EdTmyUaFIfZvVttJ9lgIA", "UCLtNLP4wxWCVUv8bSgIfNvw", "UCEklbFbPoMaV1ciEb-0mAxg", "UCkKPG3RYxCGzrM-xdBH05kg", "UCdDk7KhjfoWy0EaOhO7tfNQ", "UCMD_RlHpqnAwSgPWdhPd37g", "UC6eyKGQuHsGcXotZyVqwjTQ", "UCMHQqhtbpxfcnPPYpryapHA", "UCJI9kSwvvHX2CJeF8iZ6x8Q", "UCMY6q2GjO4w61Olo27Z7c3g", "UCyM7oro5NhR5oPyMEFB_rUA", "UCi1BNKbte8Pt8pOvKgDrsBw", "UCT2O1dUv8sBQqlCgo__KLKw", "UCeA7OylgiS7bmFg00qk250Q", "UCz1Li9JcQB9XP-HfgN0IYLQ", "UC_cOicIFgCXxo57Ew8GNXkg", "UCv3gzOEp3ToqlrnePbv_rrw", "UCkon1RijJ3-PgXKFaak8q7Q", "UCF0VIEGqqaHRrTVMBUzqbwg", "UCUxioxgZ7obrP3wVJApAK1w", "UCA4VRT895OOPPHq-pc2V2CQ"]);
          countryChannelMap.set("BR", ["UCg2iVGZWqGkzmcPNVm22PQA", "UCRHUXnfXJjjLd7RPmvdgzZA", "UCM9gZHS3PjZ8hV9smRqxdJA", "UC9lAXagRgsxfqh9Z_txkODA", "UCifzsFIiIf01IijUvEUK6Mw", "UCWLhN89W2maiH3VFHPYgtRw", "UC1asDkZQFURjnRK6ukfnCxw", "UCUxHKCQHQzDEDeM6GFPYCZA", "UCRIMRnwcEO-a7-o211fhNMw", "UCX6OQ3DkcsbYNE6H8uQQuVA", "UCbp9MyKCTEww4CxEzc_Tp0Q", "UCtpnpcN0iBupTk3MtWPzZrQ", "UCNyv46EnCgc9hT7EWUXBuPg", "UCe6eisvsctSPvBhmincn6kA", "UCwVg9btOceLQuNCdoQk9CXg", "UCHJJtInB587rDX2YOWuxDvQ", "UCrcpJHAqTGIY6DXnFvo-F5Q", "UCC8FSfSnbjiZ6vGr68ZLtzg", "UC-uIpGINZDL-VIHQQzJW8jw", "UC2SpC8rL9LaeQriE4YNdyzA", "UC0JJtK3m8pwy6rVgnBz47Rw", "UCXqV4yoyC_mmZye6VbKFPeQ", "UCoUM-UJ7rirJYP8CQ0EIaHA", "UCgM5P6QGHmrvu5fDPx79mug", "UCPuEAY09CtdTzFNWuqVZgDw", "UCWBWgCD4oAqT3hUeq40SCUw", "UCmh5gdwCx6lN7gEC20leNVA", "UCsIAfWi3uxjnQPpdvBgBI4Q", "UCiZ-lRcGWAPRTZE1G88gTqQ", "UCbV_2Ods-7z6D2ZbN3TczoQ", "UCgTmDP8oxmLM5yXGfUKXH5w", "UC-yzfnLJmz2vL1rOlb_AVGw", "UCiDqvh7HGcZtVcnoapjxolA", "UCU3JjZIPax0rTWYXAKF6sig", "UC60O6enNi0YWW_xBarUjsuQ", "UCvTdgJlENJT3IeKQmdhhQFA", "UCMqjTrrtGPI6i_i5eM0CVTg", "UCdCMfNU9hgmqSbrInxg6NYA", "UCyyZsD2CpZG9QBvdFX6Woww", "UCgIDTl8dHcJAINZLmeGVBWg", "UCpemiRRn_jkIy0SWk_sUmcg", "UCkLqIifOIO2ysGg2718Qp0w"]);
          countryChannelMap.set("CO", ["UCNbwAysZuJmp15FE67O_9qA", "UCEg_iK8FKwZfpRMn4-AnnnQ", "UCRTAHXRbRuYlsSCmb_78d_Q", "UC1j2bFSKKhyl1h3IB05A-hg", "UCmh5gdwCx6lN7gEC20leNVA", "UCc8o0cT4aD3n1Bw3k5GIdQQ", "UCbdpQVwM6iyAe2VpAnFTBxw", "UC4043jVyl39si8xvI99v5ww", "UCaXa-12BiC7gHaggyMqa9IQ", "UCAolsolgHiURrQBuZ4qe0lg", "UCt8pTdOArdJnJfxsMbuLvHQ", "UC3W0QqNMVoMRF9StkgEP_7g", "UCaY_-ksFSQtTGk0y1HA_3YQ", "UCLWCLAx6Gbs2J75Ts5IAiKA", "UCT-I1uZUgCFwnr3Xv-Fn09A", "UCWVBfvVTf3UrPA-z5gos60w", "UCNYi_zGmR519r5gYdOKLTjQ", "UCYLNGLIzMhRTi6ZOLjAPSmw", "UCecAIXPb5KTJz5BFnUzlTaA", "UCZuPJZ2kGFdlbQu1qotZaHw", "UC0JJtK3m8pwy6rVgnBz47Rw", "UCCvcd0FYi58LwyTQP9LITpA", "UCxU924xEBu5BcSGreC8Jnew", "UCsT0YIqwnpJCM-mx7-gSA4Q", "UC1DtEMePmr4O6F2do6BVl7A", "UCKyU-wd-KY4PMOcOpPQgQcw", "UCs_ineLBnNTGjrArNzjSLZg", "UC8EdTmyUaFIfZvVttJ9lgIA", "UCWsDFcIhY2DBi3GB5uykGXA", "UCo2Fr8GUPmevyi7uih-0oTg", "UCcCBMngwpMdb1AmgtR_MlFQ", "UCifgDk-uWpEOdPty8zJDoUg", "UCeU8nhO6mGDvNGcq6iW_VFQ", "UC6GkkHjigCzoVgvtYg8UB9g", "UCxfvxnhRK7cclYoUHnTtoxA", "UCs5BUBxziPYEusMTvA-E8oQ", "UCwy3Pdzk6RMLtejVuz1tI6w", "UCmG1jau_S4TXKhDjAQoOfcg", "UC4FBA16OIE-cuHLATrdxJpA", "UCl1dO7OWJ2NwRpW0NOOIkLg", "UCQc_CdpwEWsND-LyskBJA_w", "UCJfKMFp7dtO8mpHT56X0kJQ", "UCnE6Zj2llVxcvL5I38B0Ceg"]);
          countryChannelMap.set("PE", ["UCjSNHH2i0Ve5YVYOUk1sGwg", "UCZ8EhxaNHFIBLAnNzCprDiw", "UCsWHNWy_IVdlW0dx9hFTKeA", "UCaY_-ksFSQtTGk0y1HA_3YQ", "UCbdpQVwM6iyAe2VpAnFTBxw", "UCAolsolgHiURrQBuZ4qe0lg", "UCaLcUNyzcNwaUxMYMQfcb5w", "UCCm3xDalujG8RHrhdTAZlgg", "UCTqb7oZzCYpzOhPenq6AOyQ", "UCcUcfEwyDXBMsvYfoOdK7SA", "UCKVeychentkuIHNuFaA5ZjA", "UCZyqbZKCQuqF5E1EAZhBVqg", "UCVa0qpt9iw4Lg4pyJFLm6PQ", "UCCeWpi_LTJfi_AbeS2OJ6OQ", "UC7-EJtnI9Zdr6wBM4vdhnfQ", "UC-CBQChrXvLzYc9oxpMfFPg", "UC4ijq8Cg-8zQKx8OH12dUSw", "UCecAIXPb5KTJz5BFnUzlTaA", "UCrd9nnfKqHtpB_Gyg8xBwaw", "UCro6i0DgLgVntjcHkvlmbzQ", "UCKAB3SSR5WnYA_VuDCX5AVQ", "UCcAd5Np7fO8SeejB1FVKcYw", "UCIsSPTBMJXYL-JtVAr1DcFg", "UCLZLfy4DVTfpBpylslR_OPQ", "UC_IeD6kn9O0vBMQ7Al-zCTQ", "UC4gNHCugaKSSCpaI2hL2Jmg", "UC0JJtK3m8pwy6rVgnBz47Rw", "UCR_ZsBc0Jkj47y51b08N3Sg", "UCSJ4gkVC6NrvII8umztf0Ow", "UC03jIQv4WXBSHdr1DlCLYDw", "UClU87dJnn_5PQLTRNqPdsmQ", "UCWHUr9VWqdBMHKrDK9HkqsA", "UCzTtOp9QPHQUghlBPdfl45w", "UCdaSDApIZr2kefWpAFFNJLg", "UCrH7fzFL4Vevhf-uM5yl9Dw", "UCDpbu49__W6By7fWDdv8_eQ", "UCpLdxeOF7xBtUAZnyomd60g", "UCXjO5Ybiuj0KYUmfn6h_Fnw", "UC0XOJ92UN0eWVtthtopY0Jg", "UClW0fj9EUgFLLeQuoRlU7ww", "UCEUOUnri3MoSJ2ulPko6SvA", "UCeoAwDck_IgaAll_kh6Jxwg", "UCTw0MS49m81D-vEnjICDMMQ", "UCDqzSdZTX_pknvFmYRxKNrw", "UC7bObx-z__EsUvoYfYzeH8Q"]);
          countryChannelMap.set("EC", ["UC8qqE3HDiOp-Y96Zgr_ZfPQ", "UC1X8zajxMIFnA5om07sjEUw", "UCAolsolgHiURrQBuZ4qe0lg", "UCaY_-ksFSQtTGk0y1HA_3YQ", "UCe6eisvsctSPvBhmincn6kA", "UCrL_oQsZTxxVcwBBrS1fVlw", "UCL0bN6THhHVBwRPsXKOhAHg", "UCba1vMvOHWlMddLARS382Zw", "UCNvA5V-EApy0BCz7RfTM42g", "UCp45ocV_A0ypI_iC2KuPnoA", "UCLWCLAx6Gbs2J75Ts5IAiKA", "UCayET8_j1UZpC5Z1Kz3xVZw", "UCzFe9cWL6OUi141xZj1pzkA", "UCo5HJNjfdSoPWsdAHLsvSxQ", "UCTqb7oZzCYpzOhPenq6AOyQ", "UCjNgqJ_FMLntYVzq7daw1TQ", "UC4ijq8Cg-8zQKx8OH12dUSw", "UCXw1ddyrUmib3zmCmvSI1ow", "UCcAd5Np7fO8SeejB1FVKcYw", "UC-elz6w4sbn_5LB37pJjTRA", "UC4Ge3cqrdyOszmnJTcMICcg", "UC0GbKJaeEN9k5CG1NLbN6Ow", "UCs1mvSRecoRjg2eO4zVGdiQ", "UCY1kMZp36IQSyNx_9h4mpCg", "UCjkGXhZsu5H64fWuNQNf1Xw", "UCW39zufHfsuGgpLviKh297Q", "UCXKhedqbLt3Q8zZbq-E_i_Q", "UC-zNEWPxscw6kf15ilCf0bQ", "UCaUqep5GzPk7qoMwlbsD8PA", "UCx5ORNOfXUhp6yMw7pdIvNQ", "UClWWxUvcn1aE2RdHVuCtWtg", "UCXgG_pkslCJqivZLhWbOMLA", "UCCwRtme3lumNRQXMO2EvCvw", "UCUDH9jD2SblfK5vBQOVgrhg", "UCcu3TwVpUX03Kl_l6XKEdVQ", "UCoOFbKvk7COjkqB1dkpWD7w", "UCN0933hpF_Gk3dVXhhOIrKw", "UCboxIdQsA8ldaflTtDPBa2Q", "UCfXVS_zw_XmAx8iIiia1IkA", "UCnw9gQ4gor8IzsXZ-dWIRxw", "UCWADesrJsGjg3S54v08u9LA", "UCO-3aqcvw3HwwY6lRGH58vw", "UC-PfOLRF-nGcjrnedeojCyg"]);
          countryChannelMap.set("PY", ["UCp45ocV_A0ypI_iC2KuPnoA", "UCPCYlqd7uUYhVrt4HAKhAlg", "UCCm3xDalujG8RHrhdTAZlgg", "UCLvEK5IsuSZSErmoU1fOwog", "UCfs-zVPd3HlxGzFKtDXMLtQ", "UCAolsolgHiURrQBuZ4qe0lg", "UCe6eisvsctSPvBhmincn6kA", "UCTqb7oZzCYpzOhPenq6AOyQ", "UCNIz8BSPZeJayWDiMYPk5lQ", "UCaXa-12BiC7gHaggyMqa9IQ", "UCaHEdZtk6k7SVP-umnzifmQ", "UCqo103ltx_rUXCqJhpoF1Qw", "UCxU924xEBu5BcSGreC8Jnew", "UCD2w1rGcJc99akNKluz_FDw", "UCvZSJLg7pjLHzAyMMJvtnmw", "UCEklbFbPoMaV1ciEb-0mAxg", "UCSJ4gkVC6NrvII8umztf0Ow", "UCIyoG811huQwaUzs90RDjdA", "UC510QYlOlKNyhy_zdQxnGYw", "UCl9E4Zxa8CVr2LBLD0_TaNg", "UCMXAvqLnxTBMtJY2CvQEhIg", "UCpMaCx6TBwewF0VrkfpnRYQ", "UC-lFSdBsycrdoBCtZDgWl7g", "UCB1dgN49EamWXE9b5vqCacg", "UCr3iNgIx1kj_bTrpbZxf9Yg", "UCJ1m9t6jxNWFX2SGnjd0JZg", "UChglvcqTc4vJvg5XMjP7jKA", "UCqEGGqUq-Y4GWg-rmTIojFQ", "UCM5MrzBythXcWWsCzbV8L6w", "UCNzYSiIjGSJHfrjBdScrgFw", "UCoduWHPK7TuZ4MthJG-ePLw", "UC8NNg2qEuMQIXlqPS-eu_ig", "UCODtgZ_rBnbuVmhV6FrKCpQ", "UCej_YhLi_ouFU37iYwdrrRQ", "UCib5FRq9RkYDp-CobPrDqXQ", "UClERISqb7PI74-1JEBQZnJg", "UCE7Wjaudpgje8fG6_Y4hecQ", "UCR2Q6LxXc6hFJvnwVIevM5w"]);
          countryChannelMap.set("BO", ["UCaY_-ksFSQtTGk0y1HA_3YQ", "UCnHEz9DZ6EAof1-DaQGD_Xw", "UCp45ocV_A0ypI_iC2KuPnoA", "UCo5HJNjfdSoPWsdAHLsvSxQ", "UCIeuUT3mfhxreOMIls9fWew", "UCL0bN6THhHVBwRPsXKOhAHg", "UCba1vMvOHWlMddLARS382Zw", "UCzI7wZyqk7jpXWT_MILjepw", "UCCrA8ZN1J3S52wuF4vthZFQ", "UCNIz8BSPZeJayWDiMYPk5lQ", "UCl8bYBm0XAP23mReE11IBOA", "UCZyqbZKCQuqF5E1EAZhBVqg", "UCMIBUhL2pb_wPFPoeJ5MWBA", "UC6Ij1c74Gm-TicYZsKL1FAw", "UCTqb7oZzCYpzOhPenq6AOyQ", "UCyV2fYyEnnRoQpPiNk492kA", "UC-CBQChrXvLzYc9oxpMfFPg", "UC4ijq8Cg-8zQKx8OH12dUSw", "UCrp8aFu6VjkZAY9Hhj6IrXA", "UCf1XIplYiqNv9baGsFHwPPQ", "UCXw1ddyrUmib3zmCmvSI1ow", "UCs1mvSRecoRjg2eO4zVGdiQ", "UCyhbIj3hB8y1oCDU4ZXZJZg", "UCIyoG811huQwaUzs90RDjdA", "UCGYYNGmyhZ_kwBF_lqqXdAQ", "UCDRlmWkAQ7GoCNjQIXGF5Xw", "UCDwH6vSy8P5-Sf3nngtOy6g", "UCJmkopWuQxI9U0NQaOcl68Q", "UC02TmBhCP2jYWm1MUCCWGFw", "UCKadCx-t_VmwzfWczlWE98w", "UCP--bppOtrLPsVgtTgbaFpA", "UCBTuUY99I5plMaC_ZcmXIYw", "UCOLDeB-IybhEalRo_-C_Ojw", "UCbbEacbJ2Ej53588T957Drw", "UC5Df2KZ0s2h8Klub7s7Oanw", "UCzOB5P52Q49-hK_MdvMR7PQ", "UC2NMnJ9UuQxAGwwc8JhWg_A", "UCPHPu0J-6DDxyl9Fm83Z83Q", "UCaIoV23UMZNifJ3G-djMU-Q", "UCMZcWho6Nz_oPbQ0v2JB2OA", "UCW7BFA3q1DrkdhGy4heCyQw", "UC0MlKUARtHzBx9Ey_FbEO_w", "UC0nsDt9YbgpJ9631Fj4t6dA", "UCc-ki39I3dQHt6rOsLB5lng"]);
          countryChannelMap.set("VE", ["UCTqb7oZzCYpzOhPenq6AOyQ", "UC0pHpxSt_4gd63WylQL0cVQ", "UCAolsolgHiURrQBuZ4qe0lg", "UCwVg9btOceLQuNCdoQk9CXg", "UCaY_-ksFSQtTGk0y1HA_3YQ", "UCCm3xDalujG8RHrhdTAZlgg", "UCcUcfEwyDXBMsvYfoOdK7SA", "UCe6eisvsctSPvBhmincn6kA", "UCLWCLAx6Gbs2J75Ts5IAiKA", "UCbdpQVwM6iyAe2VpAnFTBxw", "UCQnK9WBcfJod8zRq7db6DTg", "UClQ3NafOy_42dJ0toK3QUKw", "UC0JJtK3m8pwy6rVgnBz47Rw", "UCnntVqOb0AOzjDE13PjHeRw", "UCMIBUhL2pb_wPFPoeJ5MWBA", "UC11aHtNnc5bEPLI4jf6mnYg", "UCjrbyUPrmuSpm9m-acvABXQ", "UCnQC_G5Xsjhp9fEJKuIcrSw", "UCIFk2uvCNcEmZ77g0ESKLcQ", "UCGttrUON87gWfU6dMWm1fcA", "UCQeRaTukNYft1_6AZPACnog", "UCo3OKK5cdUlytHgl3ehGVZA", "UC4ijq8Cg-8zQKx8OH12dUSw", "UCtVDQNGBmS8DTP5fPzM_GmQ", "UCs_ineLBnNTGjrArNzjSLZg", "UCkoujZQZatbqy4KGcgjpVxQ", "UCIsSPTBMJXYL-JtVAr1DcFg", "UCgkwoH_xiJOutAj2zyu0Ucg", "UCTK-HeQsG6v8Fs0iaMiETvw", "UC5GC_zT8jdqbJIXsVOEDvPg", "UCiP4vgwRwY-p9zPA63AkQHg", "UCETKopbJ3g1KlZVAvaw7dUw", "UCwAxTfGsJrF2BpVox780i6Q", "UC0M8_jLEvD_g_f3U8xmk5ew", "UCpqNgxhtBcCk4mVIqz26W2w", "UCYeQP7gMalG2boEZe6j6qQg", "UCFK38lePM6zqQ2CYfQyqdHA", "UCu_HzIz_RhAT_vPcvdeCbuw", "UCirDBNsOzX-Y14wEEn7m3eg", "UCYaKfA3AdTTGGqFy3YO4coQ", "UCT0h-CKwYwth2AMwVogmZSA", "UCQjOwn6SIaKrrHr_Dm34DiQ", "UCKQlpYUHB6Qr8rOwTY4iKrg", "UC9UeTUzdZ2G90vG9FS5Xurg", "UCxJC9edNcTW_3CCC8Bcmsbw", "UCv4BzevFTnGxzuIoHgoOXzQ", "UCRZlLRR9HdDDWMswklXmRfw", "UC6Ec-FX7XkF0ETIgC8We7iw", "UCIZdAZ_FrklyoHEXJgblU0Q", "UCuY-LHqPukh7nqYo-nHHUrw", "UCRA6gQgrlI-SiZQCwQJvbkQ"]);
          countryChannelMap.set("GY", ["UChXi_PlJkRMPYFQBOJ3MpxA", "UCvZSJLg7pjLHzAyMMJvtnmw", "UCyEd6QBSgat5kkC6svyjudA", "UCXw1ddyrUmib3zmCmvSI1ow", "UCaVjrfFemt82ZMgw_vaBYGQ", "UComwL29zYKujb1JhkB0EcGA", "UCOyqzCvVplZGU00vuS49zcA", "UCuFFtHWoLl5fauMMD5Ww2jA", "UCeYiAaXw-aauILPI-jSVi8g", "UCKQ-xBLhj3SkN9Wz6MwjLaA", "UC4tjY2tTltEKePusozUxtSA", "UCyps-v4WNjWDnYRKmZ4BUGw", "UCrp8aFu6VjkZAY9Hhj6IrXA", "UCBKjfVHvLdE2aQIVMWhy00A", "UCEQ9d8hoNFdWaOTxVuk8GoA", "UC73K7cmsHCLAlhiy2n69aNQ", "UC8XE-A49rEdZfEyIRAea1Ug", "UCmfwB8Dt91cOaZ4Hhyac5tw", "UCfQPeIIXEXyyVFLo0bmlmlw", "UC7hDgC7T6uJ6Q9Qk4NH-EXw", "UC0NcMsKpN9H3A9ugEouo6Iw", "UCieud0_0TZ3U5EMoY7sa-8A", "UCMDJ63wX58SCppmUKxH-R5Q", "UCoKDz01GQcsS1iuavemgrEg", "UCnXPTtHj_qNL2idFPL_MJBw", "UCqXUG2Dw0M17_qxIsUPzMYQ", "UCiLHDXgCNJM0xXtBCpfhCyg", "UCTwB2GAcdXyXuTTDawsItxA", "UCFcGxVIBPlx_l5eXfEl7jgw"]);
          countryChannelMap.set("SR", ["UCORibgWPO5FnbY-wEMvNNsg", "UCnIPAmj835YW2OUYBQIX7lw", "UCI5BkN1Dh7G8WquifrZLV1w", "UCwvq9q6O0UunlHmdPLKegDw", "UCu-9KBnwu8HAVh7zBtzrowg", "UCE1k2nRsQRu0HOC2JNm37EQ", "UCWn9ZeeCbDX-rvFO3jJK0Nw", "UC7MpM1FlnK-CgMTWvzzWDbw", "UCkFM59_sGwUQYaFtfW5Zymg", "UCTEFw9ewed8a05rdC91YmSQ", "UCFZNQoqbWeRNEYjHorJKGZA", "UC7iYwmnNjvHEOsB2Pz9_dcw", "UCcKdpPgQ1burw8sISn7YL4w", "UCBYyPLhdJtXh-bGK-4DkYlA", "UCn6fIWGYI30xGE5ouTB9rKg"]);
          countryChannelMap.set("GF", ["UC3DfvZzXwqHYLXFX4Yj2wvA", "UCj_i__0zAxLhE0WEf5X63pw", "UCv-M-lbmKT9pdO0WHOJq-aA", "UCFLGpR5H14SPIbtYbaR-T2w", "UCGF1RwmEFRiVAFaYwq_fqjA", "UCYICTODCUdIz6jqr141kI_w", "UCyf5YLGxk0qzOmJzEQqLoFg", "UCGvqQwMnH-ZyiNhw77bsh6w", "UCB1nRY5eW-on30ckq8XWFhg"]);
          countryChannelMap.set("FK", ["UCxkbb8f0TaYOhQ_dIWMSd-g", "UCh0L8fHZWyH6X6fvw8u-58Q", "UClFkkV5CRykTHutqYNXge_w", "UCcQsRCMv6jA3aFYaMWw43cg", "UCgx-6F4rB4M8yf0t90uExtg", "UCtwEGKUy2DEA5T0nhZHcwpg", "UC9KwRp1x-9PxT10fSLc-gYw", "UC7W1dIq_osDBuqTIH93HSDw", "UCxquM2kRALNdiA4cdmaRNNA", "UCXecCJDFeCu6RaZ2P7xGKGg", "UCrjrgjj8jsP3qIF2GWSmXjA", "UCqk4zMZPEvuhygJba2ZiseQ", "UCP-HlIuPQUyU0Ab5L-zPGWA", "UCU3zCEUECLVydgmbBidENLQ", "UC08JzLEblL3QLSu2cEqqPLQ"]);
          countryChannelMap.set("DE", ["UCeeHT-3WejdX6uGBgCbE7SA", "UCe6eisvsctSPvBhmincn6kA", "UC56D-IHcUvLVFTX_8NpQMXg", "UC0JJtK3m8pwy6rVgnBz47Rw", "UCuACQmW04T3v9Mz_1_suFYw", "UC0gjNuGmsefdBzCotZk_31Q", "UC114Itif9J1npupWFp2oGSA", "UC6huXz0F6-7KA7-mW0jdejA", "UCQIUhhcmXsu6cN6n3y9-Pww", "UCpIQI_HtJakX_lcyzRp7QuQ", "UCzKrJ5NSA9o7RHYRG12kHZw", "UCknLrEdhRCp1aegoMqRaCZg", "UCnuMwZoIxPK-ilnemcMOUiQ", "UCHcPqfkHN6NbWIK64HCw-Lg", "UCPs2_fXu_zZIQYI5lslUISg", "UCs33ZUq-3M7WPOyyRhgspeA", "UCFHUP1pTq7mqrYUWyyICp-A", "UCMyOj6fhvKFMjxUCp3b_3gA", "UCg9e9ny5cIIcj3NXHactp-g", "UCUb3mdcrExe--za3R65fJnQ", "UCWElrPODkWkHBti_PX6LSqw", "UCyEd6QBSgat5kkC6svyjudA", "UC0Ize0RLIbGdH5x4wI45G-A", "UCUCmKmDOuH1ETqRYfTQrJSg", "UCiLW00N3_Qe5yazpDk8xxjA", "UCbxb2fqe9oNgglAoYqsYOtQ", "UCWT3U_yPEPKN0q9w0YMQHPw", "UCsXVk37bltHxD1rDPwtNM8Q", "UC11aHtNnc5bEPLI4jf6mnYg", "UCfICLkXJnzcDDc3I7S6f9QA", "UC0BXuKeluFT72Ls5iQYs7fQ", "UCxIsefyl9g9A5SGWA4FvGIA", "UCdi8yQBdBfn1ECu3ayH_TnA", "UC9JXMJFzrQDtc2dNaUs3cZQ", "UC-AQKm7HUNMmxjdS371MSwg", "UC2bW_AY9BlbYLGJSXAbjS4Q", "UC0znI3dRWpNF8lvbPBTlzyw", "UCsSRxYAK0PiA7d0XUR6sPFA", "UCY0pZFBagHDdQ3LeUzb9IdA", "UCUaUAdqLGQWZR2wDc6BXknQ", "UCQuIaTv6Ik1yTlCOoTI5aLw", "UCyhjGHZsr4VIFToqLah3uGg", "UCUKHCqa-w6fNRLM0Gm3xFPw", "UCeJaCa0nbDn6oJjtBrYmpaQ", "UCVEVEZvgKDrf-d6SqwykXUw", "UCNgSodJAFmvgy5ZhYFrQhiw", "UCjqWpJu7s0Zz0uVAJi4DLrA", "UCedub201MgXhnYhzV_58LqQ", "UCyPEQTHQ4h7eTk-zIkBpb6w", "UCLZcxlLIOzCl4AUVV8ikCgQ", "UCbxCR9QT9YTuUa4ONm7zAaA", "UCO_G0QMo6Qo2i9DUN1OtiDg", "UCNuuBrLE9_M0WFYK21nHBkA"]);
          countryChannelMap.set("GB", ["UC6XUug9NifWGWcL86YYeYSA", "UChoQQRDf-zU1h6_YjKkWvdw", "UCOgGAfSUy5LvEyVS_LF5kdw", "UCC6M5UYVrIbtEZSi7hu5V8w", "UCuK80YHBZyyKrr2B1oHrgrw", "UC1LWEy4e4tudhEzMwjpBdsw", "UC16niRr50-MSBwiO3YDb3RA", "UCkgDHJNdiidw67LAAVooc1A", "UCTxEJoeukRCeE3j74tZjrAA", "UCFHUP1pTq7mqrYUWyyICp-A", "UC7_VkIW7nhIurDTfy-lWPDg", "UCZffS3HZmQz18zuCWStcfSA", "UCzVb0SIXp9q9PeKCcFjsBtA", "UCIaFw5VBEK8qaW6nRpx_qnw", "UCDNC_wlI1WsFX8__VeGGuOg", "UClmXPfaYhXOYsNn_QUyheWQ", "UCXGeCvGrkjSybGA98Ejuh5w", "UCuACQmW04T3v9Mz_1_suFYw", "UC2zBEPRPI-4emnMVFkJkn5g", "UCRaKwxdQ7DFFLVFN7KmUybQ", "UCGsd0rCYN3POzaFs2UQgCPw", "UCERrDZ8oN0U_n9MphMKERcg", "UCess_v-p-XioGYILA78ozcw", "UCnOr-4AIJcA4niD-v6AQIdw", "UCRw0x9_EfawqmgDI2IgQLLg", "UC-uIpGINZDL-VIHQQzJW8jw", "UCgM5P6QGHmrvu5fDPx79mug", "UCAuUUnT6oDeKwE6v1NGQxug", "UCkcEQ9D5ZZybYbpI8Ufwhwg", "UC0W6urY_d3f25KtRvI2Mm7Q", "UChKWEfWJgBw_8GOP4v9qlcA", "UC37GQFg0UwYArV8HXhCdZtg", "UCWe3Zq_-Ln5oisoi3vPsL2Q", "UCiMwrqouFvv7WlxjeiWWGpw", "UCEPMVbUzImPl4p8k4LkGevA", "UCMAcO9Gfdw6JySKxSoBuPGg", "UC03jIQv4WXBSHdr1DlCLYDw", "UCBRbxZM7CC_IvDmoLic7E-A", "UC9HocBPXanINU82K0nh6lAw", "UCi7DQdu8N8VKMMt0n-T1GeQ", "UCg-p3lQIqmhh7gHpyaOmOiQ", "UCq0pVPNYdDWQk1iTS4jTk2w", "UC47HAkQ6oZ-Hf5SVBGdvP6g", "UCbAmrmRO4H1t_fAWA4FK2oQ", "UCDddzA1UQrtWW2jIVZumVxQ", "UClWASiBZyqlxwwIClTMKzbg", "UCsJ6RuBiTVWRX156FVbeaGg", "UC7uDyFIqExDnfXAIZqumFrQ", "UCgyzA21dMwN8CS5_ZVWRiRA", "UC6hHuewUawEoLN2iLNjXYmA", "UCmS-kf2JQARzvWG3H03yPUg", "UCAajxL7P_DNhoXwOSOTyWAw"]);
          countryChannelMap.set("FR", ["UCnU18TR_lXFqIIKUO7cYlgg", "UCWrD2VhZdO-_W8QDBxiXmeg", "UCfpaSruWW3S4dibonKXENjA", "UCG899lw826XRkRDx3wphtIg", "UCHcPqfkHN6NbWIK64HCw-Lg", "UCbp9MyKCTEww4CxEzc_Tp0Q", "UCIJZA6SJ3JjvuOZgYPYOHnA", "UC99UVNiwxf-MNGnoHt0lJpg", "UCemhZ2At2lgifTJLClGCz9A", "UCAX7SvpaLzljO5n6fbTw9nQ", "UCABAQID2xmChxHzEDW_UbVw", "UCHJWF3nK_54JilwFJnXjrYQ", "UC0MGL-8ZUj8bB5rDdE4TXZQ", "UCvYPobTo42NM36X7VC4dLhA", "UCsw62CI1vi4NSCqk4R9rBuA", "UCMca7Q08z9aynM_Psi-MC2A", "UC11aHtNnc5bEPLI4jf6mnYg", "UCK6TzBHhEUCKa6dgjlsVHEw", "UCtMXv7B9VCLPtFuXJk-ToTQ", "UCOmHUn--16B90oW2L6FRR3A", "UCjrbyUPrmuSpm9m-acvABXQ", "UCM9wdMTld9eznLtoN3omCAw", "UCub5dBzD6H9Qc06ZJms9Ggg", "UCvz84_Q0BbvZThy75mbd-Dg", "UCs_ineLBnNTGjrArNzjSLZg", "UCypvWRN8Jo7mHHUPBe-Ow2w", "UC-F3kTU4V680v550AavEOsQ", "UC4ijq8Cg-8zQKx8OH12dUSw", "UCYzEMRKqrh01-tauv7MYyVQ", "UCJEWeccu2U9PN-ona1W-lRA", "UCh4o9ioiqbUveUrCLP8Wv6A", "UCXGXTy_GDJAlRTk9ypTHNKQ", "UCazoYcXP70mx3Sn7cpnC5qA", "UCtpkkV6XId_ZAYM3HfPhHoA", "UCQfwfsi5VrQ8yKZ-UWmAEFg", "UCCCPCZNChQdGa9EkATeye4g", "UCzS6lx3_vtOx5t5SDm_NYTQ", "UCJldRgT_D7Am-ErRHQZ90uw", "UCUdOoVWuWmgo1wByzcsyKDQ", "UCo3gXbvqj5heuu2zIT4lH7Q", "UC1f3LEmw3KiLiLmejqt2I2g", "UCw9evldF_qm7hW3BuU7sfAg", "UCOSycqHTVwA7KPp2Je-5bRg"]);
          countryChannelMap.set("NL", ["UCc0kHafEIzm6PiqyrsC5lyg", "UCNRRo-lro9ftQ08lUHdcZlA", "UCXw1ddyrUmib3zmCmvSI1ow", "UCXI9sfiqYnA2HV_tm_CyBQg", "UC72_FRBE63kbHDYeKgc5HDg", "UCe6eisvsctSPvBhmincn6kA", "UCyEd6QBSgat5kkC6svyjudA", "UC0Ize0RLIbGdH5x4wI45G-A", "UC-bbHiTZGWKbsCjpzUfrk6Q", "UCMyOj6fhvKFMjxUCp3b_3gA", "UCDogdKl7t7NHzQ95aEwkdMw", "UC0OjtqHqaKjetE-4oziYWug", "UCmxePybUpZj8RRuWz6r8uTQ", "UCBnbnH7DGXT9yBBVFbZeIwQ", "UCisy6taOAeLfyaCqcMQDfig", "UCPs2_fXu_zZIQYI5lslUISg", "UCu2D8oEJ34Z6XyS82ruupmw", "UCDhkOEABmUZRJhF_YCzei2w", "UCxjzlr0hdKWfIwK2lY0SvEg", "UCNYsIqBwQyhnNDVf7SXJV9w", "UCYlzNaOH_i8tSQDEQJfaZmg", "UC5xziMuoFAOpX9mwUVhe2Jw", "UCZyqbZKCQuqF5E1EAZhBVqg", "UCuACQmW04T3v9Mz_1_suFYw", "UCEEvFzLtFyIijp5g1EXQVVw", "UCKCighIcgEl2I1n6Y1mF9Lg", "UCoN7jbN54AaJXj7TcFZikCw", "UC4ijq8Cg-8zQKx8OH12dUSw", "UCWVBfvVTf3UrPA-z5gos60w", "UC-_KiH_Z2yerhAD_cAjAMOA", "UC0W6urY_d3f25KtRvI2Mm7Q", "UCzY_sIOOHeCobumpqJrjdig", "UC03jIQv4WXBSHdr1DlCLYDw", "UCpVm7bg6pXKo1Pr6k5kxG9A", "UCamdvUq4-BoneYsHZt0Agrw", "UCLZLfy4DVTfpBpylslR_OPQ", "UCbAwSkqJ1W_Eg7wr3cp5BUA", "UCpWnVA9ZxSXj8So2yZt6__w", "UCz0F9ndJTA0eL2XyL5R8YNg", "UCNMVcviSGT6eqXOQIKO12bg", "UCYLaYXb6L5dLtLR86HV1Pgg", "UC2kF6qdHRTM_hDYfEmzkS9w", "UCyVV_v2lWH87tlXyrRNWQnw", "UC3gRkej6zHEt7_AMQ5Pt0cA", "UCQS_yq2qPdfs8LPRF3UjxIA", "UCa_-kM9SoahAJOWKnr0-f7w", "UCUfXccH-ZyEQUcHEsrqw8UA", "UC_cPZBMk9Zv7ZiYrqxSDwHA", "UCHQoSTQPhQC3WrLSB_XKVDA", "UCQB7te4G9CLytduw7NcfN5w", "UC2i3SQm6aAsku9vWvBwQ5oA", "UC8AVKHd5C0X6GfgXmc4AZzA"]);
          countryChannelMap.set("CH", ["UCbp9MyKCTEww4CxEzc_Tp0Q", "UCc1eMLEEHiwcgVn1JkaBCoA", "UCSSWXxLThJqU-a8gzSTCCZg", "UCNRRo-lro9ftQ08lUHdcZlA", "UC7RCAzma8Gotzqmu2y-3Dnw", "UCXsYq7TeUBruQsG-su4_rOw", "UCCZ-gBdN59pF39tbm16xvdQ", "UCpXwMqnXfJzazKS5fJ8nrVw", "UC0Ize0RLIbGdH5x4wI45G-A", "UCg3gzldyhCHJjY7AWWTNPPA", "UC8fwExOkHg0_fX_XJcR31NA", "UCEjIjshJ8bvvCkGNk0pkYcA", "UCFX0lAkJUQwRP19Oi4BN6bA", "UCUCmKmDOuH1ETqRYfTQrJSg", "UCecAIXPb5KTJz5BFnUzlTaA", "UC69Z5Vd-Z6bdCC5LKM_lv_g", "UCLrB4AoV9Lo_aAY5eNJ0QXw", "UCKgpamMlm872zkGDcBJHYDg", "UCs_ineLBnNTGjrArNzjSLZg", "UCjrbyUPrmuSpm9m-acvABXQ", "UCdi8yQBdBfn1ECu3ayH_TnA", "UC4ijq8Cg-8zQKx8OH12dUSw", "UCkj8f9sqSKuzn-NyP7Os1ZQ", "UCKA_0KjMtWLk801XpgHjyuw", "UCbxb2fqe9oNgglAoYqsYOtQ", "UChLN0bJgq6d15OK2HVB4YTg", "UCxU924xEBu5BcSGreC8Jnew", "UCggBc5kNSAH4kFKkrYBzddQ", "UCGBDNMouiWOCVTP1Ae5xS5w", "UCNSnD3hisFi3AQCtwomG8Qw", "UCDLBQD55lbHb6hhdtyky8fA", "UCwfT8QeIiEaNmCIyOT4drJg", "UCSYnl45nK0V_z1IySmTgp9A", "UCYiaHzwtsww6phfxwUtZv8w", "UCz-ukqrTSDRT9YXWdrXoVKA", "UCrNQXOYSpV2sCAz_jV-YwLA", "UCYwakeGyGy7Z1S5cRbbDZrg", "UCqcXx-0ejNObJtCnzVHwgkA", "UCHf1sFInq929uJTIjUhh8pQ", "UCb9rZV2WDEtlVaWUZrieXoA", "UCTr0Y_z67hwEOcwOS67lj8g", "UCi0yATR3GeUGHi8zDSzKGZQ"]);
          countryChannelMap.set("SE", ["UCQxiko3707OV9Per6Eqwm2g", "UCHcPqfkHN6NbWIK64HCw-Lg", "UC-jmvhj_NLG3I89Wxx6U-Lw", "UCWBWgCD4oAqT3hUeq40SCUw", "UCpXwMqnXfJzazKS5fJ8nrVw", "UC56D-IHcUvLVFTX_8NpQMXg", "UCvjJzc-UcTv2P5LR6NGP2lg", "UC7RNjS5nGShmMSuMcVgUyjQ", "UCngGfEv69-UtPuL_Ipcy1yg", "UCWSrV2Dj98Q4fVp23wUqPhQ", "UCd-B-J0ijnZo3mODqq-t15Q", "UCqAKnz2sHsJPOrCyOvdf-iA", "UC0Ize0RLIbGdH5x4wI45G-A", "UCxOzbkk0bdVl6-tH1Fcajfg", "UCKmmERguliWTynG9OIoDhDw", "UCPs2_fXu_zZIQYI5lslUISg", "UC04lAYEYR4BiaJkbqArxmRA", "UCEjIjshJ8bvvCkGNk0pkYcA", "UCoN7jbN54AaJXj7TcFZikCw", "UCaXJEi-wOOVe2eZZHzyz4mQ", "UC8fwExOkHg0_fX_XJcR31NA", "UC_UnVDztkvE1hw064XFTNSQ", "UC6ysC3YUZbjScBKZlNLrmtQ", "UC_hoQDD6zKcIqpIYLsFbBeA", "UCop6604O_QwmEum6e0Riz2w", "UCx9XehuwNHLqWPt4U0t0LRA", "UCcTkmCKTneoDXdfkH0vGJaA", "UCgM5P6QGHmrvu5fDPx79mug", "UCNqFDjYTexJDET3rPDrmJKg", "UCWc8CackfCo4q46FpEWBcPg", "UC4ijq8Cg-8zQKx8OH12dUSw", "UCecAIXPb5KTJz5BFnUzlTaA", "UCDa5_HJ3qPkDtbRmdlqBD3g", "UC-lHJZR3Gqxm24_Vd_AJ5Yw", "UCbAwSkqJ1W_Eg7wr3cp5BUA", "UCUyVHhyGAR3djWzqlljIN1A", "UC8QylkZmeGTi5Y2VR5bf7VA", "UCDxRH_wOCO1LDcQlK3F8_HA", "UC2IUqmI5KpKKxtEa09JQyxw", "UCAYtvdQSjKROxNqMxMFQPLQ", "UC7-AfAX_aDvwmFy4sg4h3GQ", "UCU-0c1hN3jzWTdIetJCUULw", "UCflojTNXBBIK6t4ChPStXrQ", "UCFSx08Ew0iiWKyAz54Opdhw", "UCUylmntW4zhJVdGNHHopr9w", "UC_f347Y3j5d4Lo6TPjtXtyA", "UC2eveKwtwzGoou6iIeuPFkQ", "UCCzPRj-FC6utU5B_47eKv6w", "UCAiCdQ4fDNiaXG7SkuDCydQ", "UCMB3rPPxt7fTqxiTpE8WISA", "UCcXVebR3b5ubo6BwXw2Ksgw", "UCiwOIYaPaAqoVCtfj_8u15g"]);
          countryChannelMap.set("BE", ["UCHcPqfkHN6NbWIK64HCw-Lg", "UCixNwV1t6OVjrWKVPiPjrcw", "UCr3Lrf7n3h3XGjkxTOSRMCA", "UCw9XVOZBDJzOg3uZJMjDC6g", "UC0Ize0RLIbGdH5x4wI45G-A", "UCSMML7H_PjVmxeZeo_jSjIQ", "UCxU924xEBu5BcSGreC8Jnew", "UCe6eisvsctSPvBhmincn6kA", "UCZyqbZKCQuqF5E1EAZhBVqg", "UC64KwGynvj3hA7T0C9gC5cA", "UCyEd6QBSgat5kkC6svyjudA", "UCTP1RrnJ8meL1iTmBC7LSvQ", "UCt_NLJ4McJlCyYM-dSPRo7Q", "UCWVBfvVTf3UrPA-z5gos60w", "UCXw1ddyrUmib3zmCmvSI1ow", "UCJyZfWrqaGX4nwXGKOEdM6Q", "UCsSRxYAK0PiA7d0XUR6sPFA", "UCEfkxJ99kPCji_ApA69SQeQ", "UCohlG58U-fF8AxSEeB_-FMw", "UC4ijq8Cg-8zQKx8OH12dUSw", "UCyQ-DUV6lZgoL8wiPusYiUg", "UCjNgqJ_FMLntYVzq7daw1TQ", "UC0QKe0NgW-b0oZvnB5vqiJw", "UCvILah8hAWYhYOmAG3ZjvBA", "UCBDr84m_kcMea-oEQ0C6ckA", "UC_7tXpskVUnH2Mv9_nQuxkA", "UC6Mjg5R5QOJYjrio1JmP8Fg", "UCBElRVEL-H0eDYdL2mb1Sng", "UCt3XW1Un1nwg6dxQVbIcfsw", "UC65BBxbCdWzwycLdQZiHk-g", "UCiG4nUKZAuvPwRTLbF2_O7Q", "UCg8qhiH7JRWXs1WNstdGDBA", "UC3vhMqBozGwBbLCE9d3lyZQ", "UC_oTfJa5rmhxnoat5jseMnQ", "UC1ToWcL9f8RRXuBhQSXyIXw", "UCz5gX99KV1zJvBgMFZAomzQ", "UCVGS9KB-5x8vmZlcvc2vWgQ", "UC2G3rkQvo7keWAUWJ0K8oWA", "UCqB6BLkHiIKrbcX8gB38Xsg", "UCkbqWL6NDfi_Uqbqd_UOm6w", "UC5Y8f2By7K8aC0lZCRLZT3Q", "UC-RrTZfZAFlqqtme-R_ZD_A", "UCoNxjVCzvR8teTG78wfyADw", "UCy2CJyCmG9BqJUQXJjAYiDg", "UCOtdgarecstjNiMyQuyvZlg", "UCHkZCYfrR4LCY_d3M1igE5Q", "UCmK4ptIBjmo59NbM_8mxQbQ", "UCtH7VXC4kowqhH2-RMq0F-Q", "UCIBuoLQHUfbBnQQ3DXStSYA", "UCvZ2GHtdVaNDQMjZRe3v-Tg", "UCDNNKmihhgOkBIDgLIOE3xw", "UChYiqAzo8pjb3qaEdwV9HuA", "UC2uDl9wnBVgbPdNIoLX4ufw"]);
          countryChannelMap.set("AT", ["UCf-wTPj29_He4WqtatZZefA", "UCpXwMqnXfJzazKS5fJ8nrVw", "UCnHEz9DZ6EAof1-DaQGD_Xw", "UCVruJQDOaSltu7Z2ita64nQ", "UC0Ize0RLIbGdH5x4wI45G-A", "UCzBmZcTRtMUhithMG095Pzw", "UCe6eisvsctSPvBhmincn6kA", "UCyEd6QBSgat5kkC6svyjudA", "UCPs2_fXu_zZIQYI5lslUISg", "UCEHFYTkv0IIn6RYJBNcgr-Q", "UCSir19L_390tAg4IbCggvCg", "UChBEbMKI1eCcejTtmI32UEw", "UC8SNsIS6XZ6WaEeEPCSVaQg", "UC4ijq8Cg-8zQKx8OH12dUSw", "UCu2D8oEJ34Z6XyS82ruupmw", "UCjNgqJ_FMLntYVzq7daw1TQ", "UCxU924xEBu5BcSGreC8Jnew", "UCBElRVEL-H0eDYdL2mb1Sng", "UCbxb2fqe9oNgglAoYqsYOtQ", "UCxw-HVPP0iNCpXTa6gTHdpg", "UCamdvUq4-BoneYsHZt0Agrw", "UCQeRaTukNYft1_6AZPACnog", "UC2ZlZqXygcTCTlf5oNU_nfg", "UC2umy62ojMfxzzHkVcgEUUA", "UCRpjHHu8ivVWs73uxHlWwFA", "UC-elz6w4sbn_5LB37pJjTRA", "UCcjk-KvDJBEvo8fJS29fekg", "UCXw1ddyrUmib3zmCmvSI1ow", "UCdEzRtsIOFkBtJ9FuAFB_Zw", "UCy5C1ivE3Jt0oa6c_iENTBA", "UC8ztliHlp-Giv1yRKSoBZeg", "UCjfsn34VPXvEr60yxOejKbQ", "UCZIK5eFM48VfVp2PROxVb6w", "UC3DQsLbwDUnsApHenmmO6ag", "UCSchfBYlOjv09AfvSMXxgIA", "UCNUsLXlsw_OYA6PfXOaqTHw", "UClIO8c8Cia4LVScE67LvtOQ", "UCijOmqvo_qARmsFHk5KSrRw", "UCZtIOBxgLZGY_dvACmW1tnA", "UCHHYB05slIGQR5NT92EPr5g", "UC3p6tgSqCb-T2EQfebx22Og", "UCqERUCXXj4HzpwJENLn7-zw", "UCzjlAFMSNqIU4vhExPmczhQ"]);
          countryChannelMap.set("IE", ["UC56D-IHcUvLVFTX_8NpQMXg", "UCO9yfpkWdBZF6FsY0UjjSRw", "UCxgDfpB3rBRPozm3zzaRXTQ", "UCbp9MyKCTEww4CxEzc_Tp0Q", "UCmh5gdwCx6lN7gEC20leNVA", "UCPuEAY09CtdTzFNWuqVZgDw", "UC5gxP-2QqIh_09djvlm9Xcg", "UCkj8f9sqSKuzn-NyP7Os1ZQ", "UCVV9-BZ_8EybNWtbvnF8DHw", "UCVAbWl3d3XuHY28wU9DoDpA", "UCQmFNsackYMAg31IsbCkB8w", "UCg3gzldyhCHJjY7AWWTNPPA", "UCfpCQ89W9wjkHc8J_6eTbBg", "UCPuRXEsnJZJ0NkK2XwmbuCA", "UC0JJtK3m8pwy6rVgnBz47Rw", "UCgM5P6QGHmrvu5fDPx79mug", "UCk9B56310g5AREYmvRvcuNA", "UCe1IA5kmY578O_Qo7Skr-TQ", "UCGnsRwFS8Xm13lMAeouzT9g", "UCRE2zmVNW9wG2dndMoV4JKQ", "UC0QKe0NgW-b0oZvnB5vqiJw", "UC-AQKm7HUNMmxjdS371MSwg", "UCtNxjL-8WeFZ6LbfrOYgNoQ", "UCPlAajHOOhPoXlVyweFHnqg", "UCwF77i_Ks5M4Dpx9ULT0_Sw", "UCfXj9asBtiIIVlbp0wXWXdQ", "UCeYes53L01fdS4SiNv-ldxw", "UCnXwXrQ8KIBoV8k1T3xGznw", "UCcK2zRWjfPWrK2DjgiYQ9Lg", "UC6BaKCImYHSbJfXejE0DdcA", "UC7AmzwVjkG_gaFjWtGpUrYQ", "UCJ1czRR4Gstf94VvRvOff3Q", "UCdP0sBRGdiqWgkyIMhg90mw", "UCoGveWLbmCaeRf-3I97LX1w", "UCsTETijLWQxR6bj9XQBvobQ", "UCE4ekDSrwHOVMEHTfpQ-DZg", "UCxonQQlLtwMjmwOitYL5hdA", "UCupjKvR71lbE0VpF_lfB_FQ"]);
          countryChannelMap.set("NO", ["UC6dtjRVZ61_Y-HohzJ24ObA", "UCu2D8oEJ34Z6XyS82ruupmw", "UC_gSotrFVZ_PiAxo3fTQVuQ", "UCEdjL1kbZ0K8nFu519vE5LQ", "UC8fwExOkHg0_fX_XJcR31NA", "UCNRRo-lro9ftQ08lUHdcZlA", "UCBnbnH7DGXT9yBBVFbZeIwQ", "UCpXwMqnXfJzazKS5fJ8nrVw", "UCvjJzc-UcTv2P5LR6NGP2lg", "UCioNlo-f8kcEfT3Py4j1sVQ", "UCe6eisvsctSPvBhmincn6kA", "UCFX0lAkJUQwRP19Oi4BN6bA", "UCPs2_fXu_zZIQYI5lslUISg", "UCfpCQ89W9wjkHc8J_6eTbBg", "UC0Ize0RLIbGdH5x4wI45G-A", "UCkj8f9sqSKuzn-NyP7Os1ZQ", "UCWsDFcIhY2DBi3GB5uykGXA", "UCoN7jbN54AaJXj7TcFZikCw", "UCvz84_Q0BbvZThy75mbd-Dg", "UCS4uc8cHDqcwwro8lGChaQQ", "UCyps-v4WNjWDnYRKmZ4BUGw", "UCQHX6ViZmPsWiYSFAyS0a3Q", "UCJrOtniJ0-NWz37R30urifQ", "UC2bW_AY9BlbYLGJSXAbjS4Q", "UClbAm32dh0WmRLaqZlpGyCw", "UCecAIXPb5KTJz5BFnUzlTaA", "UCPHuYCxf9QJArw-4ZXXC7Ig", "UCX2Pm1JoWF3chsVOR9e1hbQ", "UCxU924xEBu5BcSGreC8Jnew", "UCNqFDjYTexJDET3rPDrmJKg", "UCLHYWdHibzsnW1M8ezRaxpQ", "UCranIPHHqqD42z5pl_BWXJQ", "UCrptgMuY4prFx6PYUuh_Seg", "UCgAmmVZsZ4vfDH-vtWawaOg", "UC7jJnOHq7ZQWyNV7UxFFF1Q", "UCI4nkoEojwi8CZ5Ql0UBPGQ", "UCQxCXtH31R6npr0BNLUjMQQ", "UCf8Z37FhKKRH_Zw8Z_9SUKg", "UCqot2irMc_8YrPRF-ZzFCXQ", "UCeXsEOBQQp-n2ThsUE0s5ag", "UCb-VnetCrVVHHG0XqNQOD0w", "UCGUyYpOkxJ3ZQKXKgoLo49Q", "UCt96nduE3s3QuEICGScxtpQ", "UChEa3pN-IsqkH43vnazKnjg", "UCFeK2aFFICfc-EQ9f5uedTg"]);
          countryChannelMap.set("DK", ["UCVNSyYuNQUwJiD0TVst9Szg", "UC8fwExOkHg0_fX_XJcR31NA", "UCNRRo-lro9ftQ08lUHdcZlA", "UCmh5gdwCx6lN7gEC20leNVA", "UCnHEz9DZ6EAof1-DaQGD_Xw", "UC0Ize0RLIbGdH5x4wI45G-A", "UCyEd6QBSgat5kkC6svyjudA", "UC7RNjS5nGShmMSuMcVgUyjQ", "UCe6eisvsctSPvBhmincn6kA", "UCuvyV3kjlg83J9C7lXPhmAQ", "UCeVkzeYJC4Z-SUde9UEJBwQ", "UCu2D8oEJ34Z6XyS82ruupmw", "UChBEbMKI1eCcejTtmI32UEw", "UCiM71b1uwRZRFKb2nAi-lhA", "UCIsSPTBMJXYL-JtVAr1DcFg", "UCOSBz_tmQfeXeID4tCvCexg", "UC0C-w0YjGpqDXGB8IHb662A", "UC2VUDuZ7jnp1Y7XmOodei8A", "UC-OknVbsuiHqT6LFPcKWlDQ", "UCxU924xEBu5BcSGreC8Jnew", "UCecAIXPb5KTJz5BFnUzlTaA", "UCNqFDjYTexJDET3rPDrmJKg", "UCLZLfy4DVTfpBpylslR_OPQ", "UCWsDFcIhY2DBi3GB5uykGXA", "UCWfi5ELXGAe-DCA6cOP3aNw", "UCX2Pm1JoWF3chsVOR9e1hbQ", "UCEk1jBxAl6fe-_G37G7huQA", "UCamdvUq4-BoneYsHZt0Agrw", "UCbbm7p8Sk15fmeU0LWk7YwA", "UC5kSbdRcfusZhmVhETFisgQ", "UCJCMsVMH8qcSG_NYOT7lPnw", "UCuIHsR72VU2ZTf_1-K8l8kA", "UC6FfVQlNBkNYJqL4H8LtGeQ", "UCO3pkWNzi9hKhLlJB9Xa2rQ", "UC67TJqYoxrdkox-FoP4N6KQ", "UCPHZjxjY099KjTp_NWqdcLA", "UCignBkCOYYgGrkeOKds-g6g", "UCwl1OBGvcYdQuQwYG0d89AQ", "UCwWV1kca2W2QZT8Hklpum-A", "UCzi29j_myNEIslRmcxTxLBg", "UCeEOeyS49pefQhG8-AR6i-Q", "UCW-znQah_R8E7bBC2oj0BUA", "UCI5pTFUqph7mg7ldQ82PnSg", "UC2a1E0E-4CV38Efpes6FDoA", "UChMcBAB7scKNScBzHb2qlqg", "UCoE9OndM_8NvUzPYtwA2JhQ", "UCbsGFAXJcdtHfiuWunx062Q", "UCasCmZqxqsUchZ6T2-xg6iQ", "UCsaq8re_YNKuvY6AyDvQ0tw", "UC20_zJHEKwBdZrvXl6PxE0Q", "UCBMB-YbiGsYdH6aUFRGDOpw", "UCvR5YwxwNtKo02xWyQcfWlw", "UCND-bB8H56APhl0ya5jCsKA"]);
          countryChannelMap.set("IS", ["UCgM5P6QGHmrvu5fDPx79mug", "UCxgDfpB3rBRPozm3zzaRXTQ", "UCVV9-BZ_8EybNWtbvnF8DHw", "UC4ijq8Cg-8zQKx8OH12dUSw", "UCbAwSkqJ1W_Eg7wr3cp5BUA", "UCFX0lAkJUQwRP19Oi4BN6bA", "UCxU924xEBu5BcSGreC8Jnew", "UCfpCQ89W9wjkHc8J_6eTbBg", "UCpVm7bg6pXKo1Pr6k5kxG9A", "UCchgIh8Tc4sTmBfnMQ5pDdg", "UCYxsXxbjJO1YYa9yQ3lKC8w", "UCRpjHHu8ivVWs73uxHlWwFA", "UCzzF1kdBgwv5RB6rbB6kVSA", "UCjNgqJ_FMLntYVzq7daw1TQ", "UCkwXupRgX4zOyqMHKRIBOww"]);
          countryChannelMap.set("MC", ["UCNbwAysZuJmp15FE67O_9qA", "UCNRRo-lro9ftQ08lUHdcZlA", "UC2NbkwekCWW12Eik964NIxw", "UCHcPqfkHN6NbWIK64HCw-Lg", "UCtLo1ovTSFkAm09lpoIkLYA", "UCyny-dfYPbE-CjAkzkZqF8A", "UCblktpvOSXAkbI-lnxLaj6Q", "UCIU0JRRQDRNFTMA9_e2Hutg", "UChbaKJjkXutsq1N6OV9gJjQ", "UCe6eisvsctSPvBhmincn6kA", "UC56D-IHcUvLVFTX_8NpQMXg", "UC72_FRBE63kbHDYeKgc5HDg", "UCtgGOdTlM-NdJ9rPKIYN8UQ", "UCpH6zd2mjaicUn4ONhRP0GQ", "UCngGfEv69-UtPuL_Ipcy1yg"]);
          countryChannelMap.set("CN", ["UCoC47do520os_4DBMEFGg4A", "UC-dBSBpG0tRI2Yy5UFeAplw", "UCm7fmBqDjPe4vxvR9eY7ljQ", "UC1ZW8rbX5Ezched-FMoFckw", "UC4onZFuO1KD5b2bG1Qcx28A", "UCqfm9cM8cJBFvTWHNm1bu3Q", "UCNilrbfI8ZdBXvPSGrm4Isg", "UCGt_Qv2eBZ5YWlTEwfqQvAQ", "UCj992YM45Hkg9msqWVQYa1g", "UCR-t_mqoIe-IJnMiUmJ2Stg", "UCJXO6DmpYe5hCTwdKBUv4qg", "UCwEYSP9fFT29gLVkohSd8YQ", "UCInT6bpyw9W5NdsDZMIBkzQ", "UCEn_SuU2BIzIzu7-x1vFv4A", "UCbfm0YMM9yqJi32Qq6mDd-g"]);
          
        // 중복 제거: channelId 기준으로 중복 제거 (최신 데이터 유지)
        const uniqueChannelsMap = new Map<string, any>();
        for (const item of allChannels) {
          const existing = uniqueChannelsMap.get(item.id);
          if (!existing || (item.snippet?.publishedAt && existing.snippet?.publishedAt && item.snippet.publishedAt > existing.snippet.publishedAt)) {
            uniqueChannelsMap.set(item.id, item);
          }
        }
        const uniqueAllChannels = Array.from(uniqueChannelsMap.values());

        // YouTube API 데이터를 우리 형식으로 변환
        const channels = uniqueAllChannels.map((item: any) => {
          const snippet = item.snippet;
          const stats = item.statistics;
          const subCount = parseInt(stats.subscriberCount || "0");
          const viewCount = parseInt(stats.viewCount || "0");
          const videoCount = parseInt(stats.videoCount || "0");
          
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
          }

          // 카테고리 추론
          let categoryName = "엔터테인먼트";
          const title = snippet.title.toLowerCase();
          if (title.includes("music") || title.includes("marshmello")) {
            categoryName = "음악";
          } else if (title.includes("education") || title.includes("cocomelon") || title.includes("tech")) {
            categoryName = "교육";
          }

          return {
            id: item.id,
            channelId: item.id,
            channelName: snippet.title,
            handle: snippet.customUrl?.replace("@", "") || snippet.title.toLowerCase().replace(/\s+/g, ""),
            profileImageUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || null,
            category: { name: categoryName },
            subscriberCount: subCount,
            totalViewCount: viewCount,
            videoCount: videoCount,
            weeklyViewCount: Math.floor(viewCount * 0.05),
            weeklySubscriberChangeRate: 1.0 + Math.random() * 2,
            weeklyViewCountChangeRate: 5.0,
            averageEngagementRate: 3.0 + Math.random() * 2,
            currentRank: null, // 정렬 후 재설정
            rankChange: 0,
            lastUpdated: new Date(),
            country: countryCode,
          };
        });

        // 잘못된 데이터 필터링
        // 1. YouTube 공식 채널 제외
        const officialChannelKeywords = [
          "youtube movies", "youtube music", "youtube kids", "youtube gaming",
          "youtube tv", "youtube originals", "youtube creators", "youtube official",
          "youtube spotlight", "youtube trends", "youtube news"
        ];
        
        // 2. 최소 기준값 설정
        const MIN_SUBSCRIBERS = 1000; // 최소 1천 구독자
        const MIN_VIEWS = 10000; // 최소 1만 조회수
        const MIN_VIDEOS = 1; // 최소 1개 비디오
        
        let filtered = channels.filter((c: any) => {
          // YouTube 공식 채널 제외
          const channelNameLower = c.channelName.toLowerCase();
          const isOfficialChannel = officialChannelKeywords.some(keyword => 
            channelNameLower.includes(keyword)
          );
          if (isOfficialChannel) {
            return false;
          }
          
          // 최소 기준값 체크
          if (c.subscriberCount < MIN_SUBSCRIBERS) {
            return false;
          }
          
          if (c.totalViewCount < MIN_VIEWS) {
            return false;
          }
          
          if (c.videoCount !== undefined && c.videoCount < MIN_VIDEOS) {
            return false;
          }
          
          // 조회수가 0인 경우 제외
          if (c.totalViewCount === 0 || !c.totalViewCount) {
            return false;
          }
          
          return true;
        });
        
        // 국가 필터링
        if (country && country !== "all") {
          filtered = filtered.filter((c: any) => c.country === country);
        }
        if (category && category !== "all") {
          const categoryMap: Record<string, string> = {
            entertainment: "엔터테인먼트", music: "음악", education: "교육",
            gaming: "게임", sports: "스포츠", news: "뉴스/정치",
            people: "인물/블로그", howto: "노하우/스타일", other: "기타",
          };
          const catName = categoryMap[category] || category;
          filtered = filtered.filter((c: any) => c.category.name === catName);
        }

        // 정렬
        const sorted = [...filtered].sort((a: any, b: any) => {
          switch (sortBy) {
            case "subscribers": return b.subscriberCount - a.subscriberCount;
            case "subscribers-weekly": return b.weeklySubscriberChangeRate - a.weeklySubscriberChangeRate;
            case "views": return b.totalViewCount - a.totalViewCount;
            case "views-weekly": return b.weeklyViewCount - a.weeklyViewCount;
            case "growth": return b.weeklySubscriberChangeRate - a.weeklySubscriberChangeRate;
            case "engagement": return b.averageEngagementRate - a.averageEngagementRate;
            default: return b.subscriberCount - a.subscriberCount;
          }
        });

        // 정렬 후 순위 재설정 (중요!)
        const rankedChannels = sorted.map((channel: any, index: number) => ({
          ...channel,
          currentRank: index + 1,
        }));

        // 페이지네이션 적용 (skip 고려하여 순위 재계산)
        const paginatedChannels = rankedChannels.slice(skip, skip + limit).map((channel: any, index: number) => ({
          ...channel,
          currentRank: skip + index + 1, // 페이지네이션 고려한 실제 순위
        }));

        return {
          channels: paginatedChannels,
          total: rankedChannels.length,
        };
      } catch (error) {
        // YouTube API 에러 (에러 로그 제거 - 성능 최적화)
        return await getMockData();
      }
    };

    // Mock 데이터 (API 키가 없거나 오류 시 사용)
    const getMockData = async () => {

      // 실제 YouTube 채널 프로필 이미지 URL 가져오기 헬퍼
      const getChannelImageUrl = async (channelId: string): Promise<string> => {
        // 실제 YouTube API를 호출하여 프로필 이미지 URL 가져오기
        const runtimeApiKeysStr = process.env.YOUTUBE_API_KEYS || process.env.YOUTUBE_API_KEY || "AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY";
        const runtimeApiKeys = runtimeApiKeysStr.split(',').map(key => key.trim()).filter(key => key.length > 0);
        
        if (runtimeApiKeys.length === 0) {
          // API 키가 없으면 placeholder 사용
          return `https://ui-avatars.com/api/?name=${encodeURIComponent(channelId)}&background=random&size=200&bold=true`;
        }

        // 첫 번째 API 키로 시도
        const apiKey = runtimeApiKeys[0];
        
        try {
          const response = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${apiKey}`
          );

          if (response.ok) {
            const data = await response.json();
            if (data.items && data.items.length > 0) {
              const thumbnailUrl = data.items[0].snippet?.thumbnails?.high?.url || 
                                   data.items[0].snippet?.thumbnails?.default?.url;
              if (thumbnailUrl) {
                
                return thumbnailUrl;
              } else {
                
              }
            } else {
              
            }
          } else {
            
          }
        } catch (error) {
          
          // 이미지 가져오기 실패 (에러 로그 제거 - 성능 최적화)
        }

        // API 호출 실패 시 placeholder 사용
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(channelId)}&background=random&size=200&bold=true`;
      };

      // 실제 YouTube 채널 ID만 사용 (프로필 이미지를 가져오기 위해)
      const mockChannelIds = [
        { id: "1", channelId: "UC-lHJZR3Gqxm24_Vd_AJ5Yw", channelName: "PewDiePie", handle: "pewdiepie", category: { name: "엔터테인먼트" }, subscriberCount: 111000000, totalViewCount: 28000000000, weeklyViewCount: 1400000000, weeklySubscriberChangeRate: 1.2, weeklyViewCountChangeRate: 5.0, averageEngagementRate: 3.5, currentRank: 1, rankChange: 0, lastUpdated: new Date() },
        { id: "2", channelId: "UCX6OQ3DkcsbYNE6H8uQQuVA", channelName: "MrBeast", handle: "MrBeast", category: { name: "엔터테인먼트" }, subscriberCount: 245000000, totalViewCount: 50000000000, weeklyViewCount: 2500000000, weeklySubscriberChangeRate: 2.5, weeklyViewCountChangeRate: 5.0, averageEngagementRate: 4.2, currentRank: 2, rankChange: 0, lastUpdated: new Date() },
        { id: "3", channelId: "UCBJycsmduvYEL83R_U4JriQ", channelName: "Marshmello", handle: "marshmello", category: { name: "음악" }, subscriberCount: 62000000, totalViewCount: 18000000000, weeklyViewCount: 900000000, weeklySubscriberChangeRate: 0.8, weeklyViewCountChangeRate: 5.0, averageEngagementRate: 3.8, currentRank: 3, rankChange: 0, lastUpdated: new Date() },
        { id: "4", channelId: "UCqVDpXKJQqrkn9NMynQiqkw", channelName: "SET India", handle: "SETIndia", category: { name: "엔터테인먼트" }, subscriberCount: 170000000, totalViewCount: 150000000000, weeklyViewCount: 7500000000, weeklySubscriberChangeRate: 1.5, weeklyViewCountChangeRate: 5.0, averageEngagementRate: 2.9, currentRank: 4, rankChange: 0, lastUpdated: new Date() },
        { id: "5", channelId: "UCJ0-Ot-VpW0uHJtZlo07ZtQ", channelName: "Cocomelon", handle: "Cocomelon", category: { name: "교육" }, subscriberCount: 180000000, totalViewCount: 170000000000, weeklyViewCount: 8500000000, weeklySubscriberChangeRate: 1.8, weeklyViewCountChangeRate: 5.0, averageEngagementRate: 4.5, currentRank: 5, rankChange: 0, lastUpdated: new Date() },
        { id: "6", channelId: "UCYfdidRxbB8Qhf0Nx7ioOYw", channelName: "Kids Diana Show", handle: "KidsDianaShow", category: { name: "엔터테인먼트" }, subscriberCount: 120000000, totalViewCount: 100000000000, weeklyViewCount: 5000000000, weeklySubscriberChangeRate: 1.0, weeklyViewCountChangeRate: 5.0, averageEngagementRate: 4.0, currentRank: 6, rankChange: 0, lastUpdated: new Date() },
        { id: "7", channelId: "UCXuqSBlHAE6Xw-yeJA0Tunw", channelName: "Linus Tech Tips", handle: "LinusTechTips", category: { name: "교육" }, subscriberCount: 16000000, totalViewCount: 8000000000, weeklyViewCount: 400000000, weeklySubscriberChangeRate: 0.5, weeklyViewCountChangeRate: 5.0, averageEngagementRate: 3.2, currentRank: 7, rankChange: 0, lastUpdated: new Date() },
        { id: "8", channelId: "UCnz-ZXXER4jOvuED5trXfEA", channelName: "Dude Perfect", handle: "DudePerfect", category: { name: "엔터테인먼트" }, subscriberCount: 60000000, totalViewCount: 15000000000, weeklyViewCount: 750000000, weeklySubscriberChangeRate: 0.6, weeklyViewCountChangeRate: 5.0, averageEngagementRate: 3.9, currentRank: 8, rankChange: 0, lastUpdated: new Date() },
        { id: "9", channelId: "UCyn-K7rZLXjGl_YVhedOZbQ", channelName: "백종원의 요리비책", handle: "paikscuisine", category: { name: "노하우/스타일" }, subscriberCount: 25000000, totalViewCount: 5000000000, weeklyViewCount: 250000000, weeklySubscriberChangeRate: 1.5, weeklyViewCountChangeRate: 5.0, averageEngagementRate: 4.3, currentRank: 9, rankChange: 0, lastUpdated: new Date() },
        { id: "10", channelId: "UCX6OQ3DkcsbYNE6H8uQQuVA", channelName: "핫소스", handle: "hotsauce", category: { name: "엔터테인먼트" }, subscriberCount: 18000000, totalViewCount: 4000000000, weeklyViewCount: 200000000, weeklySubscriberChangeRate: 2.0, weeklyViewCountChangeRate: 5.0, averageEngagementRate: 4.1, currentRank: 10, rankChange: 0, lastUpdated: new Date() },
      ];

      // 모든 채널의 실제 프로필 이미지 URL 가져오기 (병렬 처리)
      
      const mockChannels = await Promise.all(
        mockChannelIds.map(async (c) => {
          
          const profileImageUrl = await getChannelImageUrl(c.channelId);
          
          return {
            ...c,
            profileImageUrl,
          };
        })
      );

      const channelsWithCountry = mockChannels.map((c: any) => ({ 
        ...c, 
        country: c.channelId.includes("India") ? "IN" : 
                c.channelId.includes("Tech") ? "CA" : 
                c.channelId.includes("KR") ? "KR" : "US" 
      }));
      
      // 잘못된 데이터 필터링 (Mock 데이터용)
      const officialChannelKeywords = [
        "youtube movies", "youtube music", "youtube kids", "youtube gaming",
        "youtube tv", "youtube originals", "youtube creators", "youtube official",
        "youtube spotlight", "youtube trends", "youtube news"
      ];
      
      const MIN_SUBSCRIBERS = 1000;
      const MIN_VIEWS = 10000;
      
      let filtered = channelsWithCountry.filter((c: any) => {
        // YouTube 공식 채널 제외
        const channelNameLower = c.channelName.toLowerCase();
        const isOfficialChannel = officialChannelKeywords.some(keyword => 
          channelNameLower.includes(keyword)
        );
        if (isOfficialChannel) {
          return false;
        }
        
        // 최소 기준값 체크
        if (c.subscriberCount < MIN_SUBSCRIBERS) {
          return false;
        }
        
        if (c.totalViewCount < MIN_VIEWS) {
          return false;
        }
        
        // 조회수가 0인 경우 제외
        if (c.totalViewCount === 0 || !c.totalViewCount) {
          return false;
        }
        
        return true;
      });
      if (country && country !== "all") {
        filtered = filtered.filter((c: any) => c.country === country);
      }
      if (category && category !== "all") {
        const categoryMap: Record<string, string> = {
          entertainment: "엔터테인먼트", music: "음악", education: "교육",
          gaming: "게임", sports: "스포츠", news: "뉴스/정치",
          people: "인물/블로그", howto: "노하우/스타일", other: "기타",
        };
        const catName = categoryMap[category] || category;
        filtered = filtered.filter(c => c.category.name === catName);
      }
      
      const sorted = [...filtered].sort((a, b) => {
        switch (sortBy) {
          case "subscribers": return b.subscriberCount - a.subscriberCount;
          case "subscribers-weekly": return b.weeklySubscriberChangeRate - a.weeklySubscriberChangeRate;
          case "views": return b.totalViewCount - a.totalViewCount;
          case "views-weekly": return b.weeklyViewCount - a.weeklyViewCount;
          case "growth": return b.weeklySubscriberChangeRate - a.weeklySubscriberChangeRate;
          case "engagement": return b.averageEngagementRate - a.averageEngagementRate;
          default: return b.subscriberCount - a.subscriberCount;
        }
      });
      
      // 정렬 후 순위 재설정
      const rankedChannels = sorted.map((channel: any, index: number) => ({
        ...channel,
        currentRank: index + 1,
      }));
      
      // 페이지네이션 적용 (skip 고려하여 순위 재계산)
      const paginatedChannels = rankedChannels.slice(skip, skip + limit).map((channel: any, index: number) => ({
        ...channel,
        currentRank: skip + index + 1, // 페이지네이션 고려한 실제 순위
      }));
      
      return {
        channels: paginatedChannels,
        total: rankedChannels.length,
      };
    };

    // 데이터베이스 연결 확인
    let useMock = false;
    try {
      await prisma.$connect();
    } catch (dbError) {
      // 데이터베이스 연결 에러 (에러 로그 제거 - 성능 최적화)
      useMock = true;
    }

    // 카테고리 필터
    const where: any = {};
    
    // 기본 데이터 품질 필터 (데이터 부족 시 완화)
    // 1. 최소 구독자 수 (100명 이상으로 완화하여 더 많은 데이터 확보)
    where.subscriberCount = { gte: BigInt(100) };
    
    // 2. 최소 조회수 (1천 조회수 이상으로 완화)
    where.totalViewCount = { gte: BigInt(1000) };
    
    // 3. YouTube 공식 채널 제외 (채널명에 "youtube" 포함 제외)
    // Prisma에서는 복잡한 문자열 필터가 제한적이므로, 
    // 애플리케이션 레벨에서 추가 필터링 필요
    
    if (category && category !== "all") {
      const categoryMap: Record<string, string> = {
        entertainment: "엔터테인먼트",
        music: "음악",
        education: "교육",
        gaming: "게임",
        sports: "스포츠",
        news: "뉴스/정치",
        people: "인물/블로그",
        howto: "노하우/스타일",
        other: "기타",
      };
      where.category = {
        name: categoryMap[category] || category,
      };
    }

    // 국가 필터
    if (country && country !== "all") {
      where.country = country;
    }

    // 고급 검색 필터
    const minSubscribers = searchParams.get("minSubscribers");
    const maxSubscribers = searchParams.get("maxSubscribers");
    const minGrowth = searchParams.get("minGrowth");
    
    if (minSubscribers) {
      // 사용자 지정 최소값이 기본값보다 크면 사용
      const minSubs = BigInt(minSubscribers);
      if (minSubs > BigInt(1000)) {
        where.subscriberCount = { gte: minSubs };
      }
    }
    if (maxSubscribers) {
      where.subscriberCount = { ...where.subscriberCount, lte: BigInt(maxSubscribers) };
    }
    if (minGrowth) {
      where.weeklySubscriberChangeRate = { gte: parseFloat(minGrowth) };
    }

    // 정렬 기준
    let orderBy: any = {};
    switch (sortBy) {
      case "subscribers":
        orderBy = { subscriberCount: "desc" };
        break;
      case "subscribers-weekly":
        orderBy = { weeklySubscriberChangeRate: "desc" };
        break;
      case "views":
        orderBy = { totalViewCount: "desc" };
        break;
      case "views-weekly":
        orderBy = { weeklyViewCount: "desc" };
        break;
      case "growth":
        orderBy = { weeklySubscriberChangeRate: "desc" };
        break;
      case "engagement":
        orderBy = { averageEngagementRate: "desc" };
        break;
      default:
        orderBy = { subscriberCount: "desc" };
    }

    // 데이터 조회
    if (useMock) {
      // 실제 YouTube API 데이터 가져오기 시도
      const apiData = await getYouTubeAPIData();
      // YouTube 공식 채널 필터링
      const officialChannelKeywords = [
        "youtube movies", "youtube music", "youtube kids", "youtube gaming",
        "youtube tv", "youtube originals", "youtube creators", "youtube official",
        "youtube spotlight", "youtube trends", "youtube news"
      ];
      
      const filteredApiChannels = apiData.channels.filter((channel: any) => {
        const channelNameLower = channel.channelName.toLowerCase();
        const isOfficialChannel = officialChannelKeywords.some(keyword => 
          channelNameLower.includes(keyword)
        );
        return !isOfficialChannel;
      });
      
      const result = {
        channels: filteredApiChannels,
        total: filteredApiChannels.length,
        page,
        limit,
      };

      // 캐시에 저장
      rankingsCache.set(cacheKey, { data: result, timestamp: Date.now() });
      
      return NextResponse.json(result, {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        },
      });
    }

    // 쿼리 최적화: 필요한 필드만 선택
    const [channels, total] = await Promise.all([
      prisma.youTubeChannel.findMany({
        where,
        select: {
          id: true,
          channelId: true,
          channelName: true,
          handle: true,
          profileImageUrl: true,
          subscriberCount: true,
          totalViewCount: true,
          weeklySubscriberChangeRate: true,
          weeklyViewCount: true,
          weeklyViewCountChangeRate: true,
          averageEngagementRate: true,
          currentRank: true,
          rankChange: true,
          lastUpdated: true,
          country: true, // 국가 코드 추가
          category: {
            select: {
              name: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.youTubeChannel.count({ where }),
    ]);

    // YouTube 공식 채널 필터링 (애플리케이션 레벨) - 성능 최적화: Set 사용
    // 데이터 부족 시 필터링 완화
    const officialChannelKeywords = new Set([
      "youtube movies", "youtube music", "youtube kids", "youtube gaming",
      "youtube tv", "youtube originals", "youtube creators", "youtube official",
      "youtube spotlight", "youtube trends", "youtube news"
    ]);
    
    // 데이터가 적으면 필터링 완화
    const shouldFilterOfficial = channels.length > 50; // 데이터가 충분할 때만 필터링
    
    const filteredChannels = shouldFilterOfficial
      ? channels.filter((channel: any) => {
          const channelNameLower = channel.channelName?.toLowerCase() || "";
          return !Array.from(officialChannelKeywords).some(keyword => 
            channelNameLower.includes(keyword)
          );
        })
      : channels; // 데이터가 적으면 필터링하지 않음

    // BigInt를 Number로 변환 및 필드명 매핑
    const formattedChannels = filteredChannels.map((channel: any, index: number) => ({
      id: channel.id,
      channelId: channel.channelId,
      channelName: channel.channelName || "", // name 필드도 유지하되 channelName도 포함
      name: channel.channelName || "", // channelName -> name 매핑 (하위 호환성)
      handle: channel.handle,
      profileImageUrl: channel.profileImageUrl || null, // null 처리 명시
      subscriberCount: Number(channel.subscriberCount),
      totalViewCount: Number(channel.totalViewCount),
      weeklyViewCount: Number(channel.weeklyViewCount || 0),
      weeklySubscriberChangeRate: channel.weeklySubscriberChangeRate || 0,
      weeklyViewCountChangeRate: channel.weeklyViewCountChangeRate || 0,
      averageEngagementRate: channel.averageEngagementRate || 0,
      currentRank: channel.currentRank || (skip + index + 1), // 순위가 없으면 계산
      rankChange: channel.rankChange || 0,
      lastUpdated: channel.lastUpdated || new Date(),
      countryCode: channel.country || "", // country -> countryCode 매핑
      categoryName: channel.category?.name || "", // category.name -> categoryName 매핑
      category: channel.category || { name: "" }, // category 객체도 포함 (하위 호환성)
    }));

    const result = {
      channels: formattedChannels,
      total,
      page,
      limit,
    };

    // 캐시에 저장
    rankingsCache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    // 캐시 크기 제한 (최대 50개)
    if (rankingsCache.size > 50) {
      const firstKey = rankingsCache.keys().next().value;
      if (firstKey) {
        rankingsCache.delete(firstKey);
      }
    }

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    });
  } catch (error) {
    // 랭킹 가져오기 에러 (에러 로그 제거 - 성능 최적화)
    
    // 에러 발생 시 빈 배열 반환 (프론트엔드에서 처리)
    return NextResponse.json(
      { 
        error: "Failed to fetch rankings",
        channels: [],
        total: 0,
        page: 1,
        limit: 100,
        message: error instanceof Error ? error.message : "데이터를 불러오는 중 오류가 발생했습니다."
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store', // 에러는 캐시하지 않음
        },
      }
    );
  }
}

