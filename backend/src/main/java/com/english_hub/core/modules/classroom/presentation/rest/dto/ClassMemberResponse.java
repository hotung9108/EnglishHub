package com.english_hub.core.modules.classroom.presentation.rest.dto;

import com.english_hub.core.modules.classroom.domain.model.ClassMemberDetail;

public record ClassMemberResponse(Long memberId, Long studentId, String fullName, String studentCode) {

	public static ClassMemberResponse from(ClassMemberDetail member) {
		return new ClassMemberResponse(
				member.memberId(),
				member.studentId(),
				member.fullName(),
				member.studentCode());
	}
}