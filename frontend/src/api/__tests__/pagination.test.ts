import test from 'node:test';
import assert from 'node:assert/strict';
import { getPageNumbers } from '../../components/common/pagination.utils';

test('getPageNumbers - handles 1 or fewer pages', () => {
  assert.deepStrictEqual(getPageNumbers(1, 0), [1]);
  assert.deepStrictEqual(getPageNumbers(1, 1), [1]);
});

test('getPageNumbers - handles 7 or fewer pages without ellipsis', () => {
  assert.deepStrictEqual(getPageNumbers(1, 5), [1, 2, 3, 4, 5]);
  assert.deepStrictEqual(getPageNumbers(3, 7), [1, 2, 3, 4, 5, 6, 7]);
});

test('getPageNumbers - handles currentPage near the start (> 7 pages)', () => {
  assert.deepStrictEqual(getPageNumbers(1, 10), [1, 2, 3, 4, 5, '...', 10]);
  assert.deepStrictEqual(getPageNumbers(2, 10), [1, 2, 3, 4, 5, '...', 10]);
  assert.deepStrictEqual(getPageNumbers(4, 10), [1, 2, 3, 4, 5, '...', 10]);
});

test('getPageNumbers - handles currentPage near the end (> 7 pages)', () => {
  assert.deepStrictEqual(getPageNumbers(7, 10), [1, '...', 6, 7, 8, 9, 10]);
  assert.deepStrictEqual(getPageNumbers(9, 10), [1, '...', 6, 7, 8, 9, 10]);
  assert.deepStrictEqual(getPageNumbers(10, 10), [1, '...', 6, 7, 8, 9, 10]);
});

test('getPageNumbers - handles currentPage in the middle (> 7 pages)', () => {
  assert.deepStrictEqual(getPageNumbers(5, 10), [1, '...', 4, 5, 6, '...', 10]);
  assert.deepStrictEqual(getPageNumbers(6, 12), [1, '...', 5, 6, 7, '...', 12]);
});

test('Pagination range computation - items slice and boundaries', () => {
  const computeRange = (currentPage: number, pageSize: number, totalItems: number) => {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
    const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
    const endItem = Math.min(safeCurrentPage * pageSize, totalItems);
    return { totalPages, safeCurrentPage, startItem, endItem };
  };

  // Case 1: Empty list
  assert.deepStrictEqual(computeRange(1, 10, 0), {
    totalPages: 1,
    safeCurrentPage: 1,
    startItem: 0,
    endItem: 0,
  });

  // Case 2: Page 1 with 45 items
  assert.deepStrictEqual(computeRange(1, 10, 45), {
    totalPages: 5,
    safeCurrentPage: 1,
    startItem: 1,
    endItem: 10,
  });

  // Case 3: Middle page (page 3)
  assert.deepStrictEqual(computeRange(3, 10, 45), {
    totalPages: 5,
    safeCurrentPage: 3,
    startItem: 21,
    endItem: 30,
  });

  // Case 4: Last page (page 5 of 45)
  assert.deepStrictEqual(computeRange(5, 10, 45), {
    totalPages: 5,
    safeCurrentPage: 5,
    startItem: 41,
    endItem: 45,
  });

  // Case 5: Out of bounds page clamped to last page
  assert.deepStrictEqual(computeRange(99, 10, 45), {
    totalPages: 5,
    safeCurrentPage: 5,
    startItem: 41,
    endItem: 45,
  });
});
