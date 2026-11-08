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
  submissionId?: number,
  moduleId?: number
): string {
  const code = normalizeSkill(skill);
  const idParam = String(assignmentId || '1');
  const params = new URLSearchParams();
  if (submissionId) params.set('submissionId', String(submissionId));
  if (moduleId) params.set('moduleId', String(moduleId));
  const queryStr = params.toString() ? `?${params.toString()}` : '';

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
 * Resolves the authoritative ordered list of modules by combining assignmentModules
 * and submissionModules. Ensures that if assignmentModules fell back to a single
 * placeholder module on network error, all modules from submissionModules are preserved.
 */
export function resolveEffectiveModules(
  assignmentModules?: ExamModuleItem[],
  submissionModules?: SubmissionModuleItem[]
): ExamModuleItem[] {
  const aMods = assignmentModules || [];
  const sMods = (submissionModules || []).filter((sm) => Boolean(sm.skill));

  if (sMods.length === 0) {
    return aMods;
  }

  if (aMods.length === 0 || aMods.length < sMods.length) {
    return sMods.map((sm, idx) => {
      const matched = aMods.find(
        (am) => am.id === sm.moduleId || normalizeSkill(am.skill) === normalizeSkill(sm.skill)
      );
      return {
        id: matched?.id ?? sm.moduleId ?? sm.id,
        skill: matched?.skill ?? (sm.skill || 'WRITING'),
        orderIndex: matched?.orderIndex ?? idx + 1,
      };
    });
  }

  return aMods;
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
 * Checks if target module index is accessible (all valid module indices are accessible so students can choose freely)
 */
export function isModuleAccessible(
  targetIndex: number,
  assignmentModules: ExamModuleItem[],
  submissionModules?: SubmissionModuleItem[]
): boolean {
  const effectiveModules = resolveEffectiveModules(assignmentModules, submissionModules);
  if (targetIndex < 0 || targetIndex >= effectiveModules.length) return false;
  return true;
}

/**
 * Finds the first incomplete module in sequence
 */
export function getNextIncompleteModule(
  assignmentModules: ExamModuleItem[],
  submissionModules?: SubmissionModuleItem[]
): ExamModuleItem | null {
  const effectiveModules = resolveEffectiveModules(assignmentModules, submissionModules);
  if (!effectiveModules || effectiveModules.length === 0) return null;

  for (let i = 0; i < effectiveModules.length; i++) {
    const m = effectiveModules[i];
    const subMod =
      submissionModules?.find((sm) => sm.moduleId === m.id) ||
      submissionModules?.find((sm) => Boolean(sm.skill) && normalizeSkill(sm.skill) === normalizeSkill(m.skill));
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
  const effectiveModules = resolveEffectiveModules(assignmentModules, submissionModules);
  if (!effectiveModules || effectiveModules.length === 0) return false;
  if (!submissionModules || submissionModules.length === 0) return false;

  return effectiveModules.every((m) => {
    const subMod =
      submissionModules.find((sm) => sm.moduleId === m.id) ||
      submissionModules.find((sm) => Boolean(sm.skill) && normalizeSkill(sm.skill) === normalizeSkill(m.skill));
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
  hasActiveAttempt?: boolean,
  currentModuleId?: number
): ExamStepInfo[] {
  const effectiveModules = resolveEffectiveModules(assignmentModules, submissionModules);
  if (!effectiveModules || effectiveModules.length === 0) return [];

  const currentCode = currentSkill ? normalizeSkill(currentSkill) : null;
  const firstIncomplete = getNextIncompleteModule(effectiveModules, submissionModules);
  const isActive = hasActiveAttempt ?? Boolean(currentCode);

  return effectiveModules.map((module, index) => {
    const subMod =
      submissionModules?.find((sm) => sm.moduleId === module.id) ||
      submissionModules?.find((sm) => Boolean(sm.skill) && normalizeSkill(sm.skill) === normalizeSkill(module.skill));
    const isCompleted = isModuleSubmittedOrGraded(subMod);
    const isAccessible = isModuleAccessible(index, effectiveModules, submissionModules);
    const skillCode = normalizeSkill(module.skill);

    const isMatchCurrent = currentModuleId
      ? module.id === currentModuleId
      : (currentCode && skillCode === currentCode);

    let status: ExamStepStatus;
    if (isCompleted) {
      status = 'COMPLETED';
    } else if (isMatchCurrent) {
      status = 'ACTIVE';
    } else if (
      isActive &&
      !currentCode &&
      firstIncomplete &&
      firstIncomplete.id === module.id
    ) {
      status = 'ACTIVE';
    } else if (isAccessible) {
      status = 'AVAILABLE';
    } else {
      status = 'LOCKED';
    }

    // Numbered label if multiple modules exist
    const baseLabel = getSkillLabel(module.skill);
    const hasMultipleOfSameSkill = effectiveModules.filter((m) => normalizeSkill(m.skill) === skillCode).length > 1;
    let skillDisplayName = baseLabel;
    if (hasMultipleOfSameSkill) {
      const occurrenceIndex = effectiveModules.slice(0, index + 1).filter((m) => normalizeSkill(m.skill) === skillCode).length;
      skillDisplayName = `${baseLabel} (Phần ${occurrenceIndex})`;
    }

    return {
      index,
      module,
      subModule: subMod,
      status,
      skillName: skillDisplayName,
      skillCode,
      route: getSkillRoute(module.skill, assignmentId || '1', submissionId, module.id),
      isCompleted,
      isAccessible
    };
  });
}

export function getBackendDocumentMimeType(file: { name?: string; type?: string }): string {
  const fileName = (file.name || '').toLowerCase();
  const fileType = (file.type || '').toLowerCase();

  if (
    fileName.endsWith('.docx') ||
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileType === 'application/msword'
  ) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (fileName.endsWith('.txt') || fileType.startsWith('text/plain')) {
    return 'text/plain';
  }
  return 'application/pdf';
}

export interface StudentAssignmentActionTarget {
  id: number | string;
  status: 'not_started' | 'in_progress' | 'pending' | 'ai_processing' | 'graded';
  submissionId?: number | string;
  activeSkill?: string | null;
  type?: string;
}

/**
 * Resolves the navigation route when a student clicks an assignment card or action button
 * in StudentAssignments or StudentClassDetails.
 */
export function getStudentAssignmentActionRoute(target: StudentAssignmentActionTarget): string {
  const { id, status, submissionId, activeSkill, type } = target;
  const subIdStr =
    submissionId !== undefined && submissionId !== null && String(submissionId).trim() !== ''
      ? String(submissionId)
      : undefined;

  if (status === 'graded' || status === 'pending' || status === 'ai_processing') {
    return subIdStr ? `/student/submissions/${subIdStr}` : `/student/assignments/${id}/result`;
  }

  if (status === 'in_progress') {
    const numericSubId =
      subIdStr && Number.isFinite(Number(subIdStr)) ? Number(subIdStr) : undefined;
    if (activeSkill !== undefined) {
      return activeSkill
        ? getSkillRoute(activeSkill, id, numericSubId)
        : `/student/assignments/${id}/overview`;
    }
    if (type && normalizeSkill(type) !== 'unknown') {
      return getSkillRoute(type, id, numericSubId);
    }
    return `/student/assignments/${id}/overview`;
  }

  return `/student/assignments/${id}/overview`;
}

/**
 * Determines whether an exam taking page should redirect the student away
 * because:
 * 1. The parent submission is already SUBMITTED or GRADED,
 * 2. The current skill/module does not exist in the assignment, or
 * 3. The current module is already completed (SUBMITTED or GRADED).
 * Students are free to choose the order of uncompleted modules without artificial sequence locking.
 * Returns the target redirect route, or null if the student is allowed to take this module.
 */
export function getExamPageRedirectRoute(
  submission: { id: number; status: string; modules?: SubmissionModuleItem[] },
  currentSkill: string,
  assignmentId: number | string,
  assignmentModules?: ExamModuleItem[],
  targetModuleId?: number
): string | null {
  const parentStatus = submission.status?.toUpperCase();
  if (parentStatus === 'SUBMITTED' || parentStatus === 'GRADED') {
    return `/student/submissions/${submission.id}`;
  }

  const effectiveModules = resolveEffectiveModules(assignmentModules, submission.modules);
  const targetCode = normalizeSkill(currentSkill);
  
  const currentSubMod = targetModuleId
    ? submission.modules?.find((m) => m.moduleId === targetModuleId || m.id === targetModuleId)
    : submission.modules?.find((m) => normalizeSkill(m.skill) === targetCode);

  const currentMod = targetModuleId
    ? effectiveModules.find((m) => m.id === targetModuleId)
    : effectiveModules.find((m) => normalizeSkill(m.skill) === targetCode);

  // If current skill / module is not part of this assignment at all, redirect to first incomplete module
  if (effectiveModules.length > 0 && !currentMod && !currentSubMod) {
    const nextMod = getNextIncompleteModule(effectiveModules, submission.modules) || effectiveModules[0];
    if (nextMod) {
      return getSkillRoute(nextMod.skill, assignmentId, submission.id, nextMod.id);
    }
  }

  // If current module is already completed, advance to next incomplete module or submission result
  if (isModuleSubmittedOrGraded(currentSubMod)) {
    const nextMod = getNextIncompleteModule(effectiveModules, submission.modules);
    if (nextMod && (targetModuleId ? nextMod.id !== targetModuleId : normalizeSkill(nextMod.skill) !== targetCode)) {
      return getSkillRoute(nextMod.skill, assignmentId, submission.id, nextMod.id);
    }
    const totalMods = Math.max(effectiveModules.length, submission.modules?.length ?? 0);
    if (totalMods <= 1) {
      return `/student/submissions/${submission.id}`;
    }
    return `/student/assignments/${assignmentId}/overview`;
  }

  return null;
}
