// 국가 및 지역 목록
export interface Country {
  value: string;
  label: string;
  region: string;
}

export const COUNTRIES: Country[] = [
  // 전체 지역
  { value: "all", label: "전체 지역", region: "all" },
  
  // 북미 지역
  { value: "US", label: "미국", region: "north-america" },
  { value: "CA", label: "캐나다", region: "north-america" },
  { value: "MX", label: "멕시코", region: "north-america" },
  { value: "GL", label: "그린란드", region: "north-america" },
  
  // 남미 지역
  { value: "CL", label: "칠레", region: "south-america" },
  { value: "AR", label: "아르헨티나", region: "south-america" },
  { value: "UY", label: "우루과이", region: "south-america" },
  { value: "BR", label: "브라질", region: "south-america" },
  { value: "CO", label: "콜롬비아", region: "south-america" },
  { value: "PE", label: "페루", region: "south-america" },
  { value: "EC", label: "에콰도르", region: "south-america" },
  { value: "PY", label: "파라과이", region: "south-america" },
  { value: "BO", label: "볼리비아", region: "south-america" },
  { value: "VE", label: "베네수엘라", region: "south-america" },
  { value: "GY", label: "가이아나", region: "south-america" },
  { value: "SR", label: "수리남", region: "south-america" },
  { value: "GF", label: "프랑스령 기아나", region: "south-america" },
  { value: "FK", label: "포클랜드 제도", region: "south-america" },
  
  // 유럽 지역
  { value: "DE", label: "독일", region: "europe" },
  { value: "GB", label: "영국", region: "europe" },
  { value: "FR", label: "프랑스", region: "europe" },
  { value: "NL", label: "네덜란드", region: "europe" },
  { value: "CH", label: "스위스", region: "europe" },
  { value: "SE", label: "스웨덴", region: "europe" },
  { value: "BE", label: "벨기에", region: "europe" },
  { value: "AT", label: "오스트리아", region: "europe" },
  { value: "IE", label: "아일랜드", region: "europe" },
  { value: "NO", label: "노르웨이", region: "europe" },
  { value: "DK", label: "덴마크", region: "europe" },
  { value: "FI", label: "핀란드", region: "europe" },
  { value: "LU", label: "룩셈부르크", region: "europe" },
  { value: "IS", label: "아이슬란드", region: "europe" },
  { value: "MC", label: "모나코", region: "europe" },
  { value: "LI", label: "리히텐슈타인", region: "europe" },
  { value: "MT", label: "몰타", region: "europe" },
  { value: "AD", label: "안도라", region: "europe" },
  
  // 아시아 지역
  { value: "KR", label: "한국", region: "asia" },
  { value: "JP", label: "일본", region: "asia" },
  { value: "CN", label: "중국", region: "asia" },
  { value: "IN", label: "인도", region: "asia" },
  { value: "TH", label: "태국", region: "asia" },
  { value: "VN", label: "베트남", region: "asia" },
  { value: "PH", label: "필리핀", region: "asia" },
  { value: "ID", label: "인도네시아", region: "asia" },
  { value: "MY", label: "말레이시아", region: "asia" },
  { value: "SG", label: "싱가포르", region: "asia" },
  { value: "TW", label: "대만", region: "asia" },
  { value: "HK", label: "홍콩", region: "asia" },
  { value: "BD", label: "방글라데시", region: "asia" },
  { value: "PK", label: "파키스탄", region: "asia" },
  { value: "MM", label: "미얀마", region: "asia" },
  { value: "KH", label: "캄보디아", region: "asia" },
  { value: "LA", label: "라오스", region: "asia" },
  { value: "BN", label: "브루나이", region: "asia" },
  
  // 중동 지역
  { value: "SA", label: "사우디아라비아", region: "middle-east" },
  { value: "AE", label: "아랍에미리트", region: "middle-east" },
  { value: "IL", label: "이스라엘", region: "middle-east" },
  { value: "TR", label: "터키", region: "middle-east" },
  { value: "EG", label: "이집트", region: "middle-east" },
  
  // 오세아니아 지역
  { value: "AU", label: "호주", region: "oceania" },
  { value: "NZ", label: "뉴질랜드", region: "oceania" },
  
  // 아프리카 지역
  { value: "ZA", label: "남아프리카", region: "africa" },
  { value: "NG", label: "나이지리아", region: "africa" },
  { value: "KE", label: "케냐", region: "africa" },
  
  // 추가 유럽 국가
  { value: "IT", label: "이탈리아", region: "europe" },
  { value: "ES", label: "스페인", region: "europe" },
  { value: "PL", label: "폴란드", region: "europe" },
  { value: "RU", label: "러시아", region: "europe" },
  { value: "PT", label: "포르투갈", region: "europe" },
  { value: "GR", label: "그리스", region: "europe" },
  { value: "CZ", label: "체코", region: "europe" },
  { value: "RO", label: "루마니아", region: "europe" },
  { value: "HU", label: "헝가리", region: "europe" },
  { value: "UA", label: "우크라이나", region: "europe" },
];

export const REGIONS = [
  { value: "all", label: "전체 지역" },
  { value: "north-america", label: "북미 지역" },
  { value: "south-america", label: "남미 지역" },
  { value: "europe", label: "유럽 지역" },
  { value: "asia", label: "아시아 지역" },
  { value: "middle-east", label: "중동 지역" },
  { value: "oceania", label: "오세아니아 지역" },
  { value: "africa", label: "아프리카 지역" },
];

export function getCountriesByRegion(region: string): Country[] {
  if (region === "all") return COUNTRIES;
  return COUNTRIES.filter((c) => c.region === region);
}

export function getCountryByValue(value: string): Country | undefined {
  return COUNTRIES.find((c) => c.value === value);
}

