package com.english_hub.core.modules.report.domain.model;

import com.english_hub.core.modules.classroom.domain.model.ClassStatus;

public record ReportClassRow(Long classId, String className, ClassStatus status) {
}
