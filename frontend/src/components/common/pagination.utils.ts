/**
 * Generates an array of page numbers with ellipsis for display.
 * Example for totalPages=10, currentPage=5: [1, '...', 4, 5, 6, '...', 10]
 */
export function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 1) return [1];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // When near the start
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages];
  }

  // When near the end
  if (currentPage >= totalPages - 3) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  // In the middle
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}
