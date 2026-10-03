package com.english_hub.core.modules.report.presentation.rest;

import com.english_hub.core.modules.report.application.service.ReportService;
import com.english_hub.core.modules.report.application.model.ReportClassListResponse;
import com.english_hub.core.modules.report.application.model.ReportClassProgressResponse;
import com.english_hub.core.modules.report.application.model.ReportOverviewResponse;
import com.english_hub.core.modules.report.application.model.ReportStudentProgressResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reports")
@Tag(name = "Reports", description = "Báo cáo và thống kê lớp học")
public class ReportController {
	private final ReportService reportService;

	public ReportController(ReportService reportService) {
		this.reportService = reportService;
	}

	@GetMapping("/overview")
	@Operation(summary = "Tổng quan báo cáo theo khoảng thời gian")
	public ResponseEntity<ReportOverviewResponse> overview(
			@RequestParam(required = false) LocalDate from,
			@RequestParam(required = false) LocalDate to,
			@RequestParam(required = false) Long classId,
			@RequestParam(required = false) Long teacherId) {
		return ResponseEntity.ok(reportService.overview(from, to, classId, teacherId));
	}

	@GetMapping("/classes")
	@Operation(summary = "Thống kê danh sách lớp")
	public ResponseEntity<ReportClassListResponse> classes(
			@RequestParam(required = false) LocalDate from,
			@RequestParam(required = false) LocalDate to,
			@RequestParam(required = false) Long teacherId,
			@RequestParam(defaultValue = "1") int page,
			@RequestParam(defaultValue = "20") int limit) {
		return ResponseEntity.ok(reportService.classes(from, to, teacherId, page, limit));
	}

	@GetMapping("/classes/{id}/progress")
	@Operation(summary = "Tiến độ và điểm của một lớp")
	public ResponseEntity<ReportClassProgressResponse> classProgress(
			@PathVariable long id,
			@RequestParam(required = false) LocalDate from,
			@RequestParam(required = false) LocalDate to,
			@RequestParam(defaultValue = "50") BigDecimal threshold) {
		return ResponseEntity.ok(reportService.classProgress(id, from, to, threshold));
	}

	@GetMapping("/students/{id}/progress")
	@Operation(summary = "Tiến bộ của một học viên")
	public ResponseEntity<ReportStudentProgressResponse> studentProgress(
			@PathVariable long id,
			@RequestParam(required = false) Long classId,
			@RequestParam(required = false) LocalDate from,
			@RequestParam(required = false) LocalDate to) {
		return ResponseEntity.ok(reportService.studentProgress(id, classId, from, to));
	}
}
