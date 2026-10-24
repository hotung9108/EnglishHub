import type { AssignmentSkill } from '../api/services/assignment.service';

export type AssignmentBadgeType = Lowercase<AssignmentSkill>;
export type AssignmentSkillFilter = 'all' | AssignmentBadgeType;

export function toSkillBadgeTypes(skills: readonly AssignmentSkill[]): AssignmentBadgeType[] {
  return skills.map((skill) => skill.toLowerCase() as AssignmentBadgeType);
}

export function matchesSkillFilter(
  skills: readonly AssignmentSkill[],
  filter: AssignmentSkillFilter
): boolean {
  return filter === 'all' || toSkillBadgeTypes(skills).includes(filter);
}
