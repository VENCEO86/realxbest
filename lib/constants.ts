export const CATEGORIES = [
  { value: "all", label: "전체", name: "전체" },
  { value: "entertainment", label: "엔터테인먼트", name: "엔터테인먼트" },
  { value: "music", label: "음악", name: "음악" },
  { value: "education", label: "교육", name: "교육" },
  { value: "gaming", label: "게임", name: "게임" },
  { value: "sports", label: "스포츠", name: "스포츠" },
  { value: "news", label: "뉴스/정치", name: "뉴스/정치" },
  { value: "people", label: "인물/블로그", name: "인물/블로그" },
  { value: "howto", label: "노하우/스타일", name: "노하우/스타일" },
  { value: "other", label: "기타", name: "기타" },
] as const;

export const SORT_OPTIONS = [
  { value: "subscribers", label: "구독자 수 (전체)" },
  { value: "subscribers-weekly", label: "구독자 수 (주간)" },
  { value: "views", label: "조회수 (전체)" },
  { value: "views-weekly", label: "조회수 (주간)" },
  { value: "growth", label: "성장률" },
  { value: "engagement", label: "참여율" },
] as const;

export const PERIOD_OPTIONS = [
  { value: "realtime", label: "실시간" },
  { value: "weekly", label: "주간" },
  { value: "monthly", label: "월간" },
] as const;


