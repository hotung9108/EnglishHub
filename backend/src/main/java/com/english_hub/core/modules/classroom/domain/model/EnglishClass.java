package com.english_hub.core.modules.classroom.domain.model;

import com.english_hub.core.common.domain.BaseEntity;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EnglishClass extends BaseEntity<Long> {

	private String name;

	private String level;

	private String description;

	private LocalDate startDate;

	private LocalDate endDate;

	private ClassStatus status;

	private Long teacherId;
}