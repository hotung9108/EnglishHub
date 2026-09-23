package com.english_hub.core.modules.classroom.presentation.rest.dto;

import com.english_hub.core.modules.classroom.domain.model.ClassMemberDetail;
import java.util.List;

public record ClassMemberListResponse(List<ClassMemberResponse> data) {

	public static ClassMemberListResponse from(List<ClassMemberDetail> members) {
		return new ClassMemberListResponse(members.stream().map(ClassMemberResponse::from).toList());
	}
}