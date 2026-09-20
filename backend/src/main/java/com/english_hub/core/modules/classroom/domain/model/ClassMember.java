package com.english_hub.core.modules.classroom.domain.model;

import com.english_hub.core.common.domain.BaseEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClassMember extends BaseEntity<Long> {

	private Long classId;

	private Long studentId;
}