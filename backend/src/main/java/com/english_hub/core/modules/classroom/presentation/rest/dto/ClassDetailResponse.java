package com.english_hub.core.modules.classroom.presentation.rest.dto;

import com.english_hub.core.modules.classroom.application.service.ClassService.ClassDetailResult;

import java.time.LocalDate;

public record ClassDetailResponse(
		Long id,
		String name,
		String level,
		String description,
		LocalDate startDate,
		LocalDate endDate,
		String status,
		TeacherResponse teacher,
		long memberCount) {

	public static ClassDetailResponse from(ClassDetailResult result) {
		TeacherResponse teacher = result.teacher() == null
				? null
				: new TeacherResponse(result.teacher().id(), result.teacher().fullName());
		return new ClassDetailResponse(
				result.englishClass().getId(),
				result.englishClass().getName(),
				result.englishClass().getLevel(),
				result.englishClass().getDescription(),
				result.englishClass().getStartDate(),
				result.englishClass().getEndDate(),
				result.englishClass().getStatus().name(),
				teacher,
				result.memberCount());
	}
}