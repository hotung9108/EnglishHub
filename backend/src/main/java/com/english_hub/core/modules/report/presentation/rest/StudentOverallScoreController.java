package com.english_hub.core.modules.report.presentation.rest;

import com.english_hub.core.modules.report.application.model.StudentOverallScoreResponse;
import com.english_hub.core.modules.report.application.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Reports", description = "Báo cáo và thống kê lớp học")
public class StudentOverallScoreController {
	private final ReportService reportService;

	public StudentOverallScoreController(ReportService reportService) {
		this.reportService = reportService;
	}

	@GetMapping("/evaluations/students/{id}/overall")
	@Operation(summary = "Điểm tổng hợp bốn kỹ năng của học viên")
	public ResponseEntity<StudentOverallScoreResponse> overallScore(
			@PathVariable("id") long studentId,
			@RequestParam(required = false) Long classId) {
		return ResponseEntity.ok(reportService.overallScore(studentId, classId));
	}
}
