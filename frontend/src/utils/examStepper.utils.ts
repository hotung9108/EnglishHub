export interface ExamModuleItem {
  id: number;
  skill: string;
  orderIndex?: number;
}

export interface SubmissionModuleItem {
  id: number;
  moduleId: number;
  skill?: string | null;
  status: string; // 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED'
}

export type ExamSkillCode = 'listening' | 'reading' | 'writing' | 'speaking' | 'unknown';
export type ExamStepStatus = 'COMPLETED' | 'ACTIVE' | 'AVAILABLE' | 'LOCKED';

export interface ExamStepInfo {
  index: number;
  module: ExamModuleItem;
  subModule?: SubmissionModuleItem;
  status: ExamStepStatus;
  skillName: string;
  skillCode: ExamSkillCode;
  route: string;
  isCompleted: boolean;
  isAccessible: boolean;
}

/**
  * Normalizes skill string to lowercase code
  */
export function normalizeSkill(skill?: string | null): ExamSkillCode {
  if (!skill) return 'unknown';
  const s = skill.trim().toLowerCase();
  if (s.includes('listen') || s === 'ls' || s.includes('nghe')) return 'listening';
  if (s.includes('read') || s === 'rd' || s.includes('đọc') || s.includes('doc')) return 'reading';
  if (s.includes('writ') || s === 'wr' || s.includes('viết') || s.includes('viet')) return 'writing';
  if (s.includes('speak') || s === 'spk' || s.includes('nói') || s.includes('noi')) return 'speaking';
  return 'unknown';
}

/**
  * Returns user-friendly Vietnamese label for skill
  */
export function getSkillLabel(skill?: string | null): string {
  const code = normalizeSkill(skill);
  switch (code) {
    case 'listening':
      return 'Nghe (Listening)';
    case 'reading':
      return 'Đọc (Reading)';
    case 'writing':
      return 'Viết (Writing)';
    case 'speaking':
      return 'Nói (Speaking)';
    default:
      return skill || 'Kỹ năng';
  }
}

/**
  * Generates unified route for a specific skill module
  */
export function getSkillRoute(
  skill: string,
  assignmentId: number | string,
  submissionId?: number
): string {
  const code = normalizeSkill(skill);
  const idParam = String(assignmentId || '1');
  const queryStr = submissionId ? `?submissionId=${submissionId}` : '';

  switch (code) {
    case 'speaking':
      return `/student/assignments/speaking/${idParam}${queryStr}`;
    case 'reading':
      return `/student/assignments/reading/${idParam}${queryStr}`;
    case 'listening':
      return `/student/assignments/listening/${idParam}${queryStr}`;
    case 'writing':
    default:
      return `/student/assignments/writing/${idParam}${queryStr}`;
  }
}

/**
  * Checks if a submission module is completed (SUBMITTED or GRADED)
  */
export function isModuleSubmittedOrGraded(subModule?: SubmissionModuleItem): boolean {
  if (!subModule) return false;
  const st = subModule.status?.toUpperCase();
  return st === 'SUBMITTED' || st === 'GRADED';
}

/**
  * Checks if target module index is accessible (all previous modules must be completed)
  */
export function isModuleAccessible(
  targetIndex: number,
  assignmentModules: ExamModuleItem[],
  submissionModules?: SubmissionModuleItem[]
): boolean {
  if (targetIndex <= 0) return true;
  for (let i = 0; i < targetIndex; i++) {
    const prevMod = assignmentModules[i];
    const prevSubMod = submissionModules?.find(
      (sm) => sm.moduleId === prevMod.id || normalizeSkill(sm.skill) === normalizeSkill(prevMod.skill)
    );
    if (!isModuleSubmittedOrGraded(prevSubMod)) {
      return false;
    }
  }
  return true;
}

/**
  * Finds the first incomplete module in sequence
  */
export function getNextIncompleteModule(
  assignmentModules: ExamModuleItem[],
  submissionModules?: SubmissionModuleItem[]
): ExamModuleItem | null {
  if (!assignmentModules || assignmentModules.length === 0) return null;

  for (let i = 0; i < assignmentModules.length; i++) {
    const m = assignmentModules[i];
    const subMod = submissionModules?.find(
      (sm) => sm.moduleId === m.id || normalizeSkill(sm.skill) === normalizeSkill(m.skill)
    );
    if (!isModuleSubmittedOrGraded(subMod)) {
      return m;
    }
  }

  return null;
}

/**
  * Checks if all modules in assignment are completed
  */
export function isAllModulesCompleted(
  assignmentModules: ExamModuleItem[],
  submissionModules?: SubmissionModuleItem[]
): boolean {
  if (!assignmentModules || assignmentModules.length === 0) return false;
  if (!submissionModules || submissionModules.length === 0) return false;

  return assignmentModules.every((m) => {
    const subMod = submissionModules.find(
      (sm) => sm.moduleId === m.id || normalizeSkill(sm.skill) === normalizeSkill(m.skill)
    );
    return isModuleSubmittedOrGraded(subMod);
  });
}

/**
  * Calculates step information for all modules in an assignment
  */
export function calculateExamSteps(
  assignmentModules: ExamModuleItem[],
  submissionModules?: SubmissionModuleItem[],
  currentSkill?: string,
  assignmentId?: number | string,
  submissionId?: number,
  hasActiveAttempt?: boolean
): ExamStepInfo[] {
  if (!assignmentModules || assignmentModules.length === 0) return [];

  const currentCode = currentSkill ? normalizeSkill(currentSkill) : null;
  const firstIncomplete = getNextIncompleteModule(assignmentModules, submissionModules);
  const isActive = hasActiveAttempt ?? Boolean(currentCode);

  return assignmentModules.map((module, index) => {
    const subMod = submissionModules?.find(
      (sm) => sm.moduleId === module.id || normalizeSkill(sm.skill) === normalizeSkill(module.skill)
    );
    const isCompleted = isModuleSubmittedOrGraded(subMod);
    const isAccessible = isModuleAccessible(index, assignmentModules, submissionModules);
    const skillCode = normalizeSkill(module.skill);

    let status: ExamStepStatus;
    if (isCompleted) {
      status = 'COMPLETED';
    } else if (currentCode && skillCode === currentCode) {
      status = 'ACTIVE';
    } else if (
      isActive &&
      !currentCode &&
      firstIncomplete &&
      (firstIncomplete.id === module.id || normalizeSkill(firstIncomplete.skill) === skillCode)
    ) {
      status = 'ACTIVE';
    } else if (isAccessible) {
      status = 'AVAILABLE';
    } else {
      status = 'LOCKED';
    }

    return {
      index,
      module,
      subModule: subMod,
      status,
      skillName: getSkillLabel(module.skill),
      skillCode,
      route: getSkillRoute(module.skill, assignmentId || '1', submissionId),
      isCompleted,
      isAccessible
    };
  });
}

export interface StudentAssignmentActionTarget {
  id: number | string;
  status: 'not_started' | 'in_progress' | 'pending' | 'ai_processing' | 'graded';
  submissionId?: number | string;
  activeSkill?: string | null;
}

/**
  * Resolves the navigation route when a student clicks an assignment card or action button
  * in StudentAssignments or StudentClassDetails.
  */
export function getStudentAssignmentActionRoute(target: StudentAssignmentActionTarget): string {
  const { id, status, submissionId, activeSkill } = target;
  const subIdStr = submissionId !== undefined && submissionId !== null && String(submissionId).trim() !== ''
    ? String(submissionId)
    : undefined;

  if (status === 'graded' || status === 'pending' || status === 'ai_processing') {
    return subIdStr ? `/student/submissions/${subIdStr}` : `/student/assignments/${id}/result`;
  }

  if (status === 'in_progress') {
    if (activeSkill) {
      const numericSubId = subIdStr && Number.isFinite(Number(subIdStr)) ? Number(subIdStr) : undefined;
      return getSkillRoute(activeSkill, id, numericSubId);
    }
    return `/student/assignments/${id}/overview`;
  }

  return `/student/assignments/${id}/overview`;
}

/**
  * Determines whether an exam taking page should redirect the student away
  * because the parent submission or the current skill module is already completed.
  * Returns the target redirect route, or null if the student is allowed to take this module.
  */
export function getExamPageRedirectRoute(
  submission: { id: number; status: string; modules?: SubmissionModuleItem[] },
  currentSkill: string,
  assignmentId: number | string,
  assignmentModules?: ExamModuleItem[]
): string | null {
  const parentStatus = submission.status?.toUpperCase();
  if (parentStatus === 'SUBMITTED' || parentStatus === 'GRADED') {
    return `/student/submissions/${submission.id}`;
  }

  const targetCode = normalizeSkill(currentSkill);
  const currentSubMod = submission.modules?.find(
    (m) => normalizeSkill(m.skill) === targetCode
  );

  if (isModuleSubmittedOrGraded(currentSubMod)) {
    const nextMod = getNextIncompleteModule(assignmentModules || [], submission.modules);
    if (nextMod && normalizeSkill(nextMod.skill) !== targetCode) {
      return getSkillRoute(nextMod.skill, assignmentId, submission.id);
    }
    const totalMods = Math.max(assignmentModules?.length ?? 0, submission.modules?.length ?? 0);
    if (totalMods <= 1) {
      return `/student/submissions/${submission.id}`;
    }
    return `/student/assignments/${assignmentId}/overview`;
  }

  return null;
}
