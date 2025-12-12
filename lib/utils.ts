import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number | bigint): string {
  const n = typeof num === 'bigint' ? Number(num) : num;
  
  if (n >= 100000000) {
    const eok = n / 100000000;
    if (eok % 1 === 0) {
      return eok.toFixed(0) + "억";
    }
    return eok.toFixed(2) + "억";
  }
  if (n >= 10000) {
    const man = n / 10000;
    if (man % 1 === 0) {
      return man.toFixed(0) + "만";
    }
    return man.toFixed(1) + "만";
  }
  return n.toLocaleString();
}

/**
 * 차트용 숫자 포맷팅 (간단하고 읽기 쉬운 버전)
 * 예: 600000000 → 6억, 15000000 → 1,500만, 5000000 → 500만
 */
export function formatChartNumber(num: number | bigint): string {
  const n = typeof num === 'bigint' ? Number(num) : num;
  
  if (n === 0) return "0";
  
  // 억 단위
  if (n >= 100000000) {
    const eok = n / 100000000;
    if (eok >= 10) {
      return Math.floor(eok) + "억";
    }
    if (eok % 1 === 0) {
      return eok.toFixed(0) + "억";
    }
    return eok.toFixed(1) + "억";
  }
  
  // 만 단위
  if (n >= 10000) {
    const man = n / 10000;
    if (man >= 1000) {
      const cheonman = man / 1000;
      if (cheonman % 1 === 0) {
        return cheonman.toFixed(0) + "천만";
      }
      return cheonman.toFixed(1) + "천만";
    }
    if (man >= 100) {
      return Math.floor(man) + "만";
    }
    if (man % 1 === 0) {
      return man.toFixed(0) + "만";
    }
    return man.toFixed(1) + "만";
  }
  
  // 천 단위
  if (n >= 1000) {
    const cheon = n / 1000;
    if (cheon % 1 === 0) {
      return cheon.toFixed(0) + "천";
    }
    return cheon.toFixed(1) + "천";
  }
  
  return n.toLocaleString();
}

/**
 * 긴 숫자를 간결하게 포맷팅 (영문 형식)
 * 예: 600000000 → 600M, 15000000 → 15M
 */
export function formatCompactNumber(num: number | bigint): string {
  const n = typeof num === 'bigint' ? Number(num) : num;
  
  if (n >= 1000000000) {
    return (n / 1000000000).toFixed(1) + "B";
  }
  if (n >= 1000000) {
    return (n / 1000000).toFixed(1) + "M";
  }
  if (n >= 1000) {
    return (n / 1000).toFixed(1) + "K";
  }
  return n.toString();
}

