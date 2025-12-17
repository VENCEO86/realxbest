"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
}

export function Pagination({ currentPage, totalItems, itemsPerPage }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const maxVisiblePages = 10; // 최대 표시할 페이지 번호 개수
  
  // 표시할 페이지 번호 계산
  const getVisiblePages = () => {
    if (totalPages <= maxVisiblePages) {
      // 전체 페이지가 적으면 모두 표시
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // 현재 페이지 기준으로 앞뒤 페이지 계산
    const halfVisible = Math.floor(maxVisiblePages / 2);
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // 끝 페이지에 가까우면 시작 페이지 조정
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };
  
  const visiblePages = getVisiblePages();
  
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.replace(`/?${params.toString()}`, { scroll: false });
  };
  
  if (totalPages <= 1) {
    return null; // 페이지가 1개 이하면 페이지네이션 숨김
  }
  
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-4 py-3 sm:py-4 border-t bg-white dark:bg-gray-800">
      {/* 총 개수 및 페이지 정보 - 숫자 위주 깔끔한 디자인 */}
      <div className="flex items-baseline gap-1.5 sm:gap-2 text-xs sm:text-sm">
        {/* 범위 표시 */}
        <div className="flex items-baseline gap-1">
          <span className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
            {startItem.toLocaleString()}
          </span>
          <span className="text-gray-500 dark:text-gray-400 font-normal">-</span>
          <span className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
            {endItem.toLocaleString()}
          </span>
        </div>
        
        {/* 구분자 */}
        <span className="text-gray-400 dark:text-gray-500 font-light">/</span>
        
        {/* 전체 개수 */}
        <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm sm:text-base">
          {totalItems.toLocaleString()}
        </span>
        
        {/* 구분자 */}
        <span className="text-gray-400 dark:text-gray-500 mx-0.5">·</span>
        
        {/* 페이지 정보 */}
        <div className="flex items-baseline gap-1">
          <span className="font-bold text-blue-600 dark:text-blue-400 text-sm sm:text-base">
            {currentPage}
          </span>
          <span className="text-gray-400 dark:text-gray-500 font-light">/</span>
          <span className="font-semibold text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            {totalPages}
          </span>
        </div>
      </div>
      
      {/* 페이지네이션 버튼 */}
      <div className="flex items-center gap-2">
        {/* 첫 페이지 */}
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="첫 페이지"
        >
          ««
        </button>
        
        {/* 이전 페이지 */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="이전 페이지"
        >
          «
        </button>
        
        {/* 페이지 번호들 */}
        {visiblePages[0] > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              1
            </button>
            {visiblePages[0] > 2 && (
              <span className="px-2 text-gray-500 dark:text-gray-400">...</span>
            )}
          </>
        )}
        
        {visiblePages.map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              page === currentPage
                ? "bg-blue-600 text-white border border-blue-600"
                : "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
            }`}
            aria-label={`페이지 ${page}`}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </button>
        ))}
        
        {visiblePages[visiblePages.length - 1] < totalPages && (
          <>
            {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
              <span className="px-2 text-gray-500 dark:text-gray-400">...</span>
            )}
            <button
              onClick={() => handlePageChange(totalPages)}
              className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              {totalPages}
            </button>
          </>
        )}
        
        {/* 다음 페이지 */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="다음 페이지"
        >
          »
        </button>
        
        {/* 마지막 페이지 */}
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="마지막 페이지"
        >
          »»
        </button>
      </div>
    </div>
  );
}

