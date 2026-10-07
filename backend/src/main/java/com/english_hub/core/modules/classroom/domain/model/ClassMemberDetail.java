package com.english_hub.core.modules.classroom.domain.model;

/** A class member joined with the student's user and profile data. */
public record ClassMemberDetail(Long memberId, Long studentId, String fullName, String studentCode) {
}