package com.english_hub.core.modules.classroom.presentation.rest;

import com.english_hub.core.modules.classroom.application.command.AddClassMemberCommand;
import com.english_hub.core.modules.classroom.application.command.CreateClassCommand;
import com.english_hub.core.modules.classroom.application.command.UpdateClassCommand;
import com.english_hub.core.modules.classroom.application.service.ClassService;
import com.english_hub.core.modules.classroom.application.service.ClassService.ClassDetailResult;
import com.english_hub.core.modules.classroom.domain.model.ClassMemberDetail;
import com.english_hub.core.modules.classroom.domain.model.ClassPage;
import com.english_hub.core.modules.classroom.domain.model.ClassStatus;
import com.english_hub.core.modules.classroom.domain.model.EnglishClass;
import com.english_hub.core.modules.classroom.domain.model.TeacherInfo;
import com.english_hub.core.modules.classroom.presentation.rest.dto.AddClassMemberRequest;
import com.english_hub.core.modules.classroom.presentation.rest.dto.AddedClassMemberResponse;
import com.english_hub.core.modules.classroom.presentation.rest.dto.ClassDetailResponse;
import com.english_hub.core.modules.classroom.presentation.rest.dto.ClassListResponse;
import com.english_hub.core.modules.classroom.presentation.rest.dto.ClassMemberListResponse;
import com.english_hub.core.modules.classroom.presentation.rest.dto.ClassMemberResponse;
import com.english_hub.core.modules.classroom.presentation.rest.dto.ClassSummaryResponse;
import com.english_hub.core.modules.classroom.presentation.rest.dto.CreatedClassResponse;
import com.english_hub.core.modules.classroom.presentation.rest.dto.CreateClassRequest;
import com.english_hub.core.modules.classroom.presentation.rest.dto.MessageResponse;
import com.english_hub.core.modules.classroom.presentation.rest.dto.UpdateClassRequest;

import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClassControllerTest {

	@Mock
	private ClassService classService;

	private ClassController classController;

	@BeforeEach
	void setUp() {
		classController = new ClassController(classService);
	}

	@Test
	void mapsTheClassListAndPagination() {
		when(classService.listClasses("ACTIVE", 1, 20))
				.thenReturn(new ClassPage(List.of(classWithTeacher(3L)), 1, 20, 6));

		ResponseEntity<ClassListResponse> response = classController.listClasses("ACTIVE", 1, 20);

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		ClassListResponse body = response.getBody();
		assertThat(body.data()).hasSize(1);
		ClassSummaryResponse item = body.data().getFirst();
		assertThat(item.id()).isEqualTo(3L);
		assertThat(item.name()).isEqualTo("IELTS 6.5 - K12");
		assertThat(item.status()).isEqualTo("ACTIVE");
		assertThat(item.teacherId()).isEqualTo(12L);
		assertThat(body.pagination().page()).isEqualTo(1);
		assertThat(body.pagination().limit()).isEqualTo(20);
		assertThat(body.pagination().total()).isEqualTo(6);
	}

	@Test
	void mapsNullTeacherInAClassDetail() {
		when(classService.getClassDetail(7L))
				.thenReturn(new ClassDetailResult(classWithoutTeacher(7L), null, 0));

		ResponseEntity<ClassDetailResponse> response = classController.getClassDetail(7L);

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		ClassDetailResponse body = response.getBody();
		assertThat(body.id()).isEqualTo(7L);
		assertThat(body.status()).isEqualTo("ACTIVE");
		assertThat(body.teacher()).isNull();
		assertThat(body.memberCount()).isZero();
	}

	@Test
	void mapsATeacherIntoAClassDetail() {
		when(classService.getClassDetail(3L)).thenReturn(new ClassDetailResult(
				classWithTeacher(3L), new TeacherInfo(12L, "Đoàn Thái Sơn"), 18));

		ResponseEntity<ClassDetailResponse> response = classController.getClassDetail(3L);

		ClassDetailResponse body = response.getBody();
		assertThat(body.teacher().id()).isEqualTo(12L);
		assertThat(body.teacher().fullName()).isEqualTo("Đoàn Thái Sơn");
		assertThat(body.memberCount()).isEqualTo(18L);
		assertThat(body.startDate()).isEqualTo(LocalDate.of(2026, 9, 15));
	}

	@Test
	void forwardsAScopedListRequestToTheService() {
		when(classService.listClasses(null, 2, 10))
				.thenReturn(new ClassPage(List.of(), 2, 10, 0));

		ResponseEntity<ClassListResponse> response = classController.listClasses(null, 2, 10);

		verify(classService).listClasses(null, 2, 10);
		assertThat(response.getBody().data()).isEmpty();
	}

	@Test
	void forwardsACreateRequestAndReturnsCreated() {
		when(classService.createClass(new CreateClassCommand(
				"Class Seven", null, null, LocalDate.of(2026, 9, 15), null, null)))
				.thenReturn(7L);

		ResponseEntity<CreatedClassResponse> response = classController.createClass(new CreateClassRequest(
				"Class Seven", null, null, LocalDate.of(2026, 9, 15), null, null));

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
		assertThat(response.getBody()).isEqualTo(new CreatedClassResponse("Tạo lớp thành công.", 7L));
	}

	@Test
	void forwardsAnUpdateRequestAndReturnsTheSuccessMessage() {
		ResponseEntity<MessageResponse> response = classController.updateClass(3L, new UpdateClassRequest(
				"IELTS 7.5 - K01", "Advanced", "Chỉnh sửa", null, "COMPLETED", 14L));

		verify(classService).updateClass(3L, new UpdateClassCommand(
				"IELTS 7.5 - K01", "Advanced", "Chỉnh sửa", null, "COMPLETED", 14L));
		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		assertThat(response.getBody()).isEqualTo(new MessageResponse("Cập nhật lớp học thành công."));
	}

	@Test
	void mapsDeleteToTheSuccessMessage() {
		ResponseEntity<MessageResponse> response = classController.deleteClass(3L);

		verify(classService).deleteClass(3L);
		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		assertThat(response.getBody()).isEqualTo(new MessageResponse("Xoá lớp học thành công."));
	}

	@Test
	void mapsTheClassRosterWithoutPagination() {
		when(classService.listClassMembers(3L)).thenReturn(List.of(
				new ClassMemberDetail(7L, 41L, "Trần Tiến Sơn", "HV0012")));

		ResponseEntity<ClassMemberListResponse> response = classController.listClassMembers(3L);

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		ClassMemberListResponse body = response.getBody();
		assertThat(body.data()).hasSize(1);
		ClassMemberResponse item = body.data().getFirst();
		assertThat(item.memberId()).isEqualTo(7L);
		assertThat(item.studentId()).isEqualTo(41L);
		assertThat(item.fullName()).isEqualTo("Trần Tiến Sơn");
		assertThat(item.studentCode()).isEqualTo("HV0012");
	}

	@Test
	void forwardsAnAddMemberRequestAndReturnsCreated() {
		when(classService.addClassMember(3L, new AddClassMemberCommand(41L))).thenReturn(12L);

		ResponseEntity<AddedClassMemberResponse> response =
				classController.addClassMember(3L, new AddClassMemberRequest(41L));

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
		assertThat(response.getBody()).isEqualTo(new AddedClassMemberResponse("Đã thêm học viên vào lớp.", 12L));
	}

	@Test
	void mapsRemoveMemberToTheSuccessMessage() {
		ResponseEntity<MessageResponse> response = classController.removeClassMember(3L, 7L);

		verify(classService).removeClassMember(3L, 7L);
		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		assertThat(response.getBody()).isEqualTo(new MessageResponse("Đã xoá học viên khỏi lớp."));
	}

	private EnglishClass classWithTeacher(long id) {
		EnglishClass englishClass = new EnglishClass(
				"IELTS 6.5 - K12",
				"Intermediate",
				"Luyện IELTS",
				LocalDate.of(2026, 9, 15),
				null,
				ClassStatus.ACTIVE,
				12L);
		englishClass.setId(id);
		return englishClass;
	}

	private EnglishClass classWithoutTeacher(long id) {
		EnglishClass englishClass = new EnglishClass(
				"Class Seven",
				null,
				null,
				LocalDate.of(2026, 9, 15),
				null,
				ClassStatus.ACTIVE,
				null);
		englishClass.setId(id);
		return englishClass;
	}
}