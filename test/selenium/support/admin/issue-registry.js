// Public issues already reviewed; links do not change case expectations or outcomes.
const issue = (number, group) => ({group, url:`https://github.com/hotung9108/EnglishHub/issues/${number}`});
const accounts = issue(189, 'Accounts search');
const students = issue(190, 'Students search');
const identity = issue(191, 'Student identity');
const settings = issue(197, 'System settings');
export const adminIssueRefs = {
  'QA31-003':[accounts],
  'QA31-006':[accounts],
  'QA31-007':[accounts],
  'QA31-008':[accounts],
  'QA31-014':[students],
  'QA31-020':[identity],
  'QA31-021':[issue(192, 'Assignments error state')],
  'QA31-025':[issue(193, 'Reports class filter')],
  'QA31-031':[issue(194, 'Audit detail access')],
  'QA31-036':[issue(195, 'UI role mapping'), issue(196, 'Related API diagnostic')],
  'QA31-041':[students],
  'QA31-042':[identity],
  'QA31-048':[settings],
  'QA31-049':[settings],
};
