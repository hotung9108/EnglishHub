package com.english_hub.core.modules.report.domain.model;

import java.util.List;

public record ReportClassPage(List<ReportClassRow> classes, long total) {
}
