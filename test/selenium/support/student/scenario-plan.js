// Selected runs prepare only their own prerequisites; full runs use the union.
const keys = {
  1: [], 2: [], 3: [], 4: ['writing', 'reading', 'listening', 'speaking'],
  5: ['writing'], 6: ['writing'], 7: ['writing'], 8: ['draft'], 9: ['draft'], 10: ['draft'],
  11: ['writing'], 12: ['document'], 13: ['reading'], 14: ['wrong'], 15: ['listening'], 16: ['speaking'],
  17: ['graded'], 18: ['graded'], 19: ['graded'], 20: [], 21: [], 22: ['graded'], 23: [],
  24: ['graded'], 25: ['mcqReading'], 26: ['mcqWrong'], 27: ['mcqListening'], 28: ['graded'],
  29: [], 30: ['graded'], 31: ['graded'], 32: ['graded'], 33: ['graded'],
  34: ['graded'], 35: ['graded'], 36: ['graded'], 37: ['graded'], 38: ['draft'],
  39: ['speakingValidation'], 40: ['draft'], 41: ['navigation'], 42: ['navigation'],
  43: [], 44: ['mcqCancel'], 45: ['graded'],
};
const evaluations = new Set([20, 21, 23, 33]);
export function studentPlan(caseId) {
  const numbers = caseId ? [Number(caseId.replace(/^QA30-/, ''))] : Object.keys(keys).map(Number);
  if (numbers.some(n => !Object.hasOwn(keys, n))) throw new Error(`Unknown student case: ${caseId}`);
  const assignments = [...new Set(numbers.flatMap(n => keys[n]))];
  return { assignments, grading: assignments.includes('graded'), evaluation: numbers.some(n => evaluations.has(n)) };
}
