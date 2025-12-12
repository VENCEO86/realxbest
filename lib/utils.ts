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
 * 차트용 숫자 포맷팅 (간단한 버전)
 */
export function formatChartNumber(num: number | bigint): string {
  const n = typeof num === 'bigint' ? Number(num) : num;
  
  if (n >= 100000000) {
    return (n / 100000000).toFixed(1) + "억";
  }
  if (n >= 10000) {
    return (n / 10000).toFixed(1) + "만";
  }
  if (n >= 1000) {
    return (n / 1000).toFixed(1) + "천";
  }
  return n.toString();
}

