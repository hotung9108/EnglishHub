package com.english_hub.core.modules.report.application.model;

import com.english_hub.core.modules.report.domain.model.ReportAssignmentCompletionCount;
import com.english_hub.core.modules.report.domain.model.ReportAssignmentCount;
import com.english_hub.core.modules.report.domain.model.ReportMemberCount;
import java.util.List;

public record ReportCompletionRows(
		List<ReportAssignmentCount> assignments,
		List<ReportMemberCount> members,
		List<ReportAssignmentCompletionCount> completed) {
}
