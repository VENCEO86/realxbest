import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 100000000) {
    const eok = num / 100000000;
    // 소수점 2자리까지 표시하되, .00은 제거
    if (eok % 1 === 0) {
      return eok.toFixed(0) + "억";
    }
    return eok.toFixed(2) + "억";
  }
  if (num >= 10000) {
    const man = num / 10000;
    // 소수점 1자리까지 표시하되, .0은 제거
    if (man % 1 === 0) {
      return man.toFixed(0) + "만";
    }
    return man.toFixed(1) + "만";
  }
  return num.toLocaleString();
}

