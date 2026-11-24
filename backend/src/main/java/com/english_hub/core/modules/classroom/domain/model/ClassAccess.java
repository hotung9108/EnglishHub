package com.english_hub.core.modules.classroom.domain.model;

/**
 * Minimal projection used to authorise a user against a class.
 *
 * <p>It exists so a permission check does not need two independent SELECTs
 * (class row + class member row). On staging the database lives in Singapore,
 * so every removed query saves a full network round-trip.</p>
 *
 * @param classId       id of the class
 * @param teacherId     assigned teacher, or {@code null} when the class has none
 * @param studentMember whether the queried user is a member of the class
 */
public record ClassAccess(Long classId, Long teacherId, boolean studentMember) {
}
