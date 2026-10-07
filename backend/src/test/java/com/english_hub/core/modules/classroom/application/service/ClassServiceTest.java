package com.english_hub.core.modules.classroom.application.service;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.modules.classroom.application.command.AddClassMemberCommand;
import com.english_hub.core.modules.classroom.application.command.CreateClassCommand;
import com.english_hub.core.modules.classroom.application.command.UpdateClassCommand;
import com.english_hub.core.modules.classroom.application.service.ClassService.ClassDetailResult;
import com.english_hub.core.modules.classroom.domain.model.ClassMember;
import com.english_hub.core.modules.classroom.domain.model.ClassMemberDetail;
import com.english_hub.core.modules.classroom.domain.model.ClassPage;
import com.english_hub.core.modules.classroom.domain.model.ClassStatus;
import com.english_hub.core.modules.classroom.domain.model.EnglishClass;
import com.english_hub.core.modules.classroom.domain.model.TeacherInfo;
import com.english_hub.core.modules.classroom.domain.repository.ClassMemberRepository;
import com.english_hub.core.modules.classroom.domain.repository.ClassRepository;
import com.english_hub.core.modules.user.application.port.CurrentUserProvider;
import com.english_hub.core.modules.user.domain.model.User;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClassServiceTest {

	@Mock
	private ClassRepository classRepository;

	@Mock
	private ClassMemberRepository classMemberRepository;

	@Mock
	private CurrentUserProvider currentUserProvider;

	private ClassService classService;

	@BeforeEach
	void setUp() {
		classService = new ClassService(classRepository, classMemberRepository, currentUserProvider);
	}

	@Test
	void listsClassesScopedAsAdminWithDefaultPageAndLimit() {
		ClassPage expected = new ClassPage(List.of(classWithTeacher(3L)), 1, 20, 6);
		when(currentUserProvider.requireActiveUser()).thenReturn(user(1L, UserRole.ADMIN));
		when(classRepository.findPage(eq(null), eq(UserRole.ADMIN), eq(1L), any()))
				.thenReturn(expected);

		ClassPage actual = classService.listClasses(null, 1, 20);

		assertThat(actual.total()).isEqualTo(6);
		ArgumentCaptor<com.english_hub.core.modules.classroom.application.page.ClassPageRequest> captor =
				ArgumentCaptor.forClass(com.english_hub.core.modules.classroom.application.page.ClassPageRequest.class);
		verify(classRepository).findPage(eq(null), eq(UserRole.ADMIN), eq(1L), captor.capture());
		assertThat(captor.getValue().page()).isEqualTo(1);
		assertThat(captor.getValue().limit()).isEqualTo(20);
	}

	@Test
	void passesTheCallerUserIdForTeacherScoping() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(12L, UserRole.TEACHER));
		when(classRepository.findPage(eq(null), eq(UserRole.TEACHER), eq(12L), any()))
				.thenReturn(new ClassPage(List.of(), 1, 20, 0));

		classService.listClasses(null, 1, 20);

		verify(classRepository).findPage(eq(null), eq(UserRole.TEACHER), eq(12L), any());
	}

	@Test
	void passesTheCallerUserIdForStudentScoping() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(41L, UserRole.STUDENT));
		when(classRepository.findPage(eq(null), eq(UserRole.STUDENT), eq(41L), any()))
				.thenReturn(new ClassPage(List.of(), 1, 20, 0));

		classService.listClasses(null, 1, 20);

		verify(classRepository).findPage(eq(null), eq(UserRole.STUDENT), eq(41L), any());
	}

	@Test
	void forwardsTheStatusFilterToTheRepository() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(1L, UserRole.ADMIN));
		when(classRepository.findPage(eq(ClassStatus.ACTIVE), eq(UserRole.ADMIN), eq(1L), any()))
				.thenReturn(new ClassPage(List.of(), 1, 20, 0));

		classService.listClasses("ACTIVE", 1, 20);

		verify(classRepository).findPage(eq(ClassStatus.ACTIVE), eq(UserRole.ADMIN), eq(1L), any());
	}

	@Test
	void rejectsInvalidPaginationBeforeQueryingClasses() {
		assertThatThrownBy(() -> classService.listClasses(null, 0, 20))
				.isInstanceOf(ApiException.class)
				.hasMessage("Dữ liệu không hợp lệ.");
		verify(classRepository, never()).findPage(any(), any(), anyLong(), any());
		verify(currentUserProvider, never()).requireActiveUser();
	}

	@Test
	void rejectsAnUnknownStatusFilter() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(1L, UserRole.ADMIN));

		assertThatThrownBy(() -> classService.listClasses("FROZEN", 1, 20))
				.isInstanceOf(ApiException.class)
				.hasMessage("status không hợp lệ.");
		verify(classRepository, never()).findPage(any(), any(), anyLong(), any());
	}

	@Test
	void returnsClassDetailWithTeacherAndMemberCount() {
		when(classRepository.findById(3L)).thenReturn(Optional.of(classWithTeacher(3L)));
		when(classRepository.findTeacher(12L)).thenReturn(Optional.of(new TeacherInfo(12L, "Đoàn Thái Sơn")));
		when(classMemberRepository.countByClassId(3L)).thenReturn(18L);

		ClassDetailResult result = classService.getClassDetail(3L);

		assertThat(result.englishClass().getName()).isEqualTo("IELTS 6.5 - K12");
		assertThat(result.teacher()).isEqualTo(new TeacherInfo(12L, "Đoàn Thái Sơn"));
		assertThat(result.memberCount()).isEqualTo(18L);
	}

	@Test
	void returnsNullTeacherAndZeroMembersForAnUnassignedEmptyClass() {
		when(classRepository.findById(7L)).thenReturn(Optional.of(classWithoutTeacher(7L)));
		when(classMemberRepository.countByClassId(7L)).thenReturn(0L);

		ClassDetailResult result = classService.getClassDetail(7L);

		assertThat(result.teacher()).isNull();
		assertThat(result.memberCount()).isZero();
	}

	@Test
	void returnsNotFoundForAnUnknownClass() {
		when(classRepository.findById(404L)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> classService.getClassDetail(404L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không tìm thấy lớp học.");
		verify(classMemberRepository, never()).countByClassId(any(Long.class));
	}

	@Test
	void createsAClassWithOnlyTheRequiredFields() {
		when(classRepository.save(any(EnglishClass.class))).thenAnswer(invocation -> {
			EnglishClass englishClass = invocation.getArgument(0);
			englishClass.setId(7L);
			return englishClass;
		});

		long id = classService.createClass(new CreateClassCommand(
				"Class Seven", null, null, LocalDate.of(2026, 9, 15), null, null));

		assertThat(id).isEqualTo(7L);
		ArgumentCaptor<EnglishClass> captor = ArgumentCaptor.forClass(EnglishClass.class);
		verify(classRepository).save(captor.capture());
		EnglishClass saved = captor.getValue();
		assertThat(saved.getName()).isEqualTo("Class Seven");
		assertThat(saved.getStartDate()).isEqualTo(LocalDate.of(2026, 9, 15));
		assertThat(saved.getStatus()).isEqualTo(ClassStatus.ACTIVE);
		assertThat(saved.getTeacherId()).isNull();
	}

	@Test
	void createsAClassWithTeacherAndEndDate() {
		when(classRepository.teacherExists(12L)).thenReturn(true);
		when(classRepository.save(any(EnglishClass.class))).thenAnswer(invocation -> {
			EnglishClass englishClass = invocation.getArgument(0);
			englishClass.setId(8L);
			return englishClass;
		});

		long id = classService.createClass(new CreateClassCommand(
				"IELTS 7.0 - K01",
				"Advanced",
				null,
				LocalDate.of(2026, 9, 15),
				LocalDate.of(2027, 1, 31),
				12L));

		assertThat(id).isEqualTo(8L);
		ArgumentCaptor<EnglishClass> captor = ArgumentCaptor.forClass(EnglishClass.class);
		verify(classRepository).save(captor.capture());
		EnglishClass saved = captor.getValue();
		assertThat(saved.getLevel()).isEqualTo("Advanced");
		assertThat(saved.getEndDate()).isEqualTo(LocalDate.of(2027, 1, 31));
		assertThat(saved.getTeacherId()).isEqualTo(12L);
	}

	@Test
	void rejectsCreateWithoutAName() {
		assertThatThrownBy(() -> classService.createClass(new CreateClassCommand(
				"  ", null, null, LocalDate.of(2026, 9, 15), null, null)))
				.isInstanceOf(ApiException.class)
				.hasMessage("Vui lòng nhập đầy đủ tên lớp và ngày bắt đầu.");
		verify(classRepository, never()).save(any(EnglishClass.class));
	}

	@Test
	void rejectsCreateWithoutAStartDate() {
		assertThatThrownBy(() -> classService.createClass(new CreateClassCommand(
				"Class Seven", null, null, null, null, null)))
				.isInstanceOf(ApiException.class)
				.hasMessage("Vui lòng nhập đầy đủ tên lớp và ngày bắt đầu.");
		verify(classRepository, never()).save(any(EnglishClass.class));
	}

	@Test
	void rejectsAClassNameLongerThanOneHundredFiftyCharacters() {
		String tooLongName = "X".repeat(151);

		assertThatThrownBy(() -> classService.createClass(new CreateClassCommand(
				tooLongName, null, null, LocalDate.of(2026, 9, 15), null, null)))
				.isInstanceOf(ApiException.class)
				.hasMessage("Dữ liệu không hợp lệ.");
		verify(classRepository, never()).save(any(EnglishClass.class));
	}

	@Test
	void rejectsANullCommandOnCreate() {
		assertThatThrownBy(() -> classService.createClass(null))
				.isInstanceOf(ApiException.class)
				.hasMessage("Vui lòng nhập đầy đủ tên lớp và ngày bắt đầu.");
	}

	@Test
	void rejectsAnEndDateBeforeTheStartDateOnCreate() {
		assertThatThrownBy(() -> classService.createClass(new CreateClassCommand(
				"Class Seven", null, null,
				LocalDate.of(2026, 9, 15), LocalDate.of(2026, 9, 1), null)))
				.isInstanceOf(ApiException.class)
				.hasMessage("Ngày kết thúc phải sau ngày bắt đầu.");
		verify(classRepository, never()).save(any(EnglishClass.class));
	}

	@Test
	void acceptsAnEndDateEqualToTheStartDateOnCreate() {
		when(classRepository.save(any(EnglishClass.class))).thenAnswer(invocation -> {
			EnglishClass englishClass = invocation.getArgument(0);
			englishClass.setId(7L);
			return englishClass;
		});

		classService.createClass(new CreateClassCommand(
				"Class Seven", null, null,
				LocalDate.of(2026, 9, 15), LocalDate.of(2026, 9, 15), null));

		verify(classRepository).save(any(EnglishClass.class));
	}

	@Test
	void rejectsANonExistentTeacherOnCreate() {
		when(classRepository.teacherExists(99L)).thenReturn(false);

		assertThatThrownBy(() -> classService.createClass(new CreateClassCommand(
				"Class Seven", null, null, LocalDate.of(2026, 9, 15), null, 99L)))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không tìm thấy giáo viên (teacherId không tồn tại).");
		verify(classRepository, never()).save(any(EnglishClass.class));
	}

	@Test
	void updatesClassFieldsAndReassignsTheTeacher() {
		when(classRepository.findById(3L)).thenReturn(Optional.of(classWithTeacher(3L)));
		when(classRepository.teacherExists(14L)).thenReturn(true);

		classService.updateClass(3L, new UpdateClassCommand(
				"IELTS 7.5 - K01", "Advanced", "Chỉnh sửa", null, "COMPLETED", 14L));

		ArgumentCaptor<EnglishClass> captor = ArgumentCaptor.forClass(EnglishClass.class);
		verify(classRepository).save(captor.capture());
		EnglishClass saved = captor.getValue();
		assertThat(saved.getName()).isEqualTo("IELTS 7.5 - K01");
		assertThat(saved.getLevel()).isEqualTo("Advanced");
		assertThat(saved.getDescription()).isEqualTo("Chỉnh sửa");
		assertThat(saved.getStatus()).isEqualTo(ClassStatus.COMPLETED);
		assertThat(saved.getTeacherId()).isEqualTo(14L);
	}

	@Test
	void rejectsUpdateOfAnUnknownClass() {
		when(classRepository.findById(404L)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> classService.updateClass(404L, new UpdateClassCommand(
				"New Name", null, null, null, null, null)))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không tìm thấy lớp học.");
	}

	@Test
	void rejectsUpdateWithNoRecognizedField() {
		when(classRepository.findById(3L)).thenReturn(Optional.of(classWithTeacher(3L)));

		assertThatThrownBy(() -> classService.updateClass(3L, new UpdateClassCommand(
				null, null, null, null, null, null)))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không có dữ liệu để cập nhật.");
		verify(classRepository, never()).save(any(EnglishClass.class));
	}

	@Test
	void rejectsAnInvalidStatusOnUpdate() {
		when(classRepository.findById(3L)).thenReturn(Optional.of(classWithTeacher(3L)));

		assertThatThrownBy(() -> classService.updateClass(3L, new UpdateClassCommand(
				null, null, null, null, "FROZEN", null)))
				.isInstanceOf(ApiException.class)
				.hasMessage("status phải là ACTIVE, INACTIVE, COMPLETED hoặc CANCELLED.");
		verify(classRepository, never()).save(any(EnglishClass.class));
	}

	@Test
	void rejectsAnEndDateBeforeTheStoredStartDateOnUpdate() {
		when(classRepository.findById(3L)).thenReturn(Optional.of(classWithTeacher(3L)));

		assertThatThrownBy(() -> classService.updateClass(3L, new UpdateClassCommand(
				null, null, null, LocalDate.of(2026, 9, 1), null, null)))
				.isInstanceOf(ApiException.class)
				.hasMessage("Ngày kết thúc phải sau ngày bắt đầu.");
		verify(classRepository, never()).save(any(EnglishClass.class));
	}

	@Test
	void rejectsANonExistentTeacherOnUpdate() {
		when(classRepository.findById(3L)).thenReturn(Optional.of(classWithTeacher(3L)));
		when(classRepository.teacherExists(99L)).thenReturn(false);

		assertThatThrownBy(() -> classService.updateClass(3L, new UpdateClassCommand(
				null, null, null, null, null, 99L)))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không tìm thấy giáo viên (teacherId không tồn tại).");
		verify(classRepository, never()).save(any(EnglishClass.class));
	}

	@Test
	void deletesAnEmptyClass() {
		when(classRepository.findById(3L)).thenReturn(Optional.of(classWithTeacher(3L)));
		when(classRepository.hasRelatedData(3L)).thenReturn(false);

		classService.deleteClass(3L);

		verify(classRepository).deleteById(3L);
	}

	@Test
	void rejectsDeleteOfAnUnknownClass() {
		when(classRepository.findById(404L)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> classService.deleteClass(404L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không tìm thấy lớp học.");
		verify(classRepository, never()).deleteById(anyLong());
	}

	@Test
	void rejectsDeleteOfAClassWithRelatedData() {
		when(classRepository.findById(3L)).thenReturn(Optional.of(classWithTeacher(3L)));
		when(classRepository.hasRelatedData(3L)).thenReturn(true);

		assertThatThrownBy(() -> classService.deleteClass(3L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không thể xoá: lớp học vẫn còn dữ liệu liên quan.");
		verify(classRepository, never()).deleteById(3L);
	}

	@Test
	void listsMembersForAnExistingClass() {
		when(classRepository.existsById(3L)).thenReturn(true);
		when(classMemberRepository.findMembersWithStudentInfo(3L))
				.thenReturn(List.of(
						new ClassMemberDetail(7L, 41L, "Trần Tiến Sơn", "HV0012"),
						new ClassMemberDetail(8L, 42L, "Lê Văn Hùng", "HV0013")));

		List<ClassMemberDetail> members = classService.listClassMembers(3L);

		assertThat(members).hasSize(2);
		assertThat(members.getFirst().memberId()).isEqualTo(7L);
		assertThat(members.getFirst().fullName()).isEqualTo("Trần Tiến Sơn");
		assertThat(members.getFirst().studentCode()).isEqualTo("HV0012");
	}

	@Test
	void returnsAnEmptyRosterForAClassWithoutMembers() {
		when(classRepository.existsById(3L)).thenReturn(true);
		when(classMemberRepository.findMembersWithStudentInfo(3L)).thenReturn(List.of());

		assertThat(classService.listClassMembers(3L)).isEmpty();
	}

	@Test
	void rejectsListingMembersForAnUnknownClass() {
		when(classRepository.existsById(404L)).thenReturn(false);

		assertThatThrownBy(() -> classService.listClassMembers(404L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không tìm thấy lớp học.");
		verify(classMemberRepository, never()).findMembersWithStudentInfo(any(Long.class));
	}

	@Test
	void addsAStudentToAClassAndReturnsTheNewMemberId() {
		when(classRepository.existsById(3L)).thenReturn(true);
		when(classRepository.studentExists(41L)).thenReturn(true);
		when(classMemberRepository.existsByClassIdAndStudentId(3L, 41L)).thenReturn(false);
		when(classMemberRepository.save(any(ClassMember.class))).thenAnswer(invocation -> {
			ClassMember member = invocation.getArgument(0);
			member.setId(12L);
			return member;
		});

		long memberId = classService.addClassMember(3L, new AddClassMemberCommand(41L));

		assertThat(memberId).isEqualTo(12L);
		ArgumentCaptor<ClassMember> captor = ArgumentCaptor.forClass(ClassMember.class);
		verify(classMemberRepository).save(captor.capture());
		assertThat(captor.getValue().getClassId()).isEqualTo(3L);
		assertThat(captor.getValue().getStudentId()).isEqualTo(41L);
	}

	@Test
	void rejectsAddingAStudentWithoutAnId() {
		assertThatThrownBy(() -> classService.addClassMember(3L, new AddClassMemberCommand(null)))
				.isInstanceOf(ApiException.class)
				.hasMessage("Thiếu mã học viên.");
		verify(classMemberRepository, never()).save(any(ClassMember.class));
	}

	@Test
	void rejectsAddingAStudentToAnUnknownClass() {
		when(classRepository.existsById(404L)).thenReturn(false);

		assertThatThrownBy(() -> classService.addClassMember(404L, new AddClassMemberCommand(41L)))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không tìm thấy lớp học hoặc học viên.");
		verify(classMemberRepository, never()).save(any(ClassMember.class));
	}

	@Test
	void rejectsAddingAnUnknownStudent() {
		when(classRepository.existsById(3L)).thenReturn(true);
		when(classRepository.studentExists(999L)).thenReturn(false);

		assertThatThrownBy(() -> classService.addClassMember(3L, new AddClassMemberCommand(999L)))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không tìm thấy lớp học hoặc học viên.");
		verify(classMemberRepository, never()).save(any(ClassMember.class));
	}

	@Test
	void rejectsAddingADuplicateStudent() {
		when(classRepository.existsById(3L)).thenReturn(true);
		when(classRepository.studentExists(41L)).thenReturn(true);
		when(classMemberRepository.existsByClassIdAndStudentId(3L, 41L)).thenReturn(true);

		assertThatThrownBy(() -> classService.addClassMember(3L, new AddClassMemberCommand(41L)))
				.isInstanceOf(ApiException.class)
				.hasMessage("Học viên đã có trong lớp.");
		verify(classMemberRepository, never()).save(any(ClassMember.class));
	}

	@Test
	void removesAMemberFromAClass() {
		ClassMember member = new ClassMember(3L, 41L);
		member.setId(7L);
		when(classMemberRepository.findByClassIdAndId(3L, 7L)).thenReturn(Optional.of(member));

		classService.removeClassMember(3L, 7L);

		verify(classMemberRepository).deleteById(7L);
	}

	@Test
	void rejectsRemovingAMemberFromAnotherClass() {
		when(classMemberRepository.findByClassIdAndId(3L, 7L)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> classService.removeClassMember(3L, 7L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không tìm thấy thành viên trong lớp.");
		verify(classMemberRepository, never()).deleteById(anyLong());
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

	private User user(long id, UserRole role) {
		return new User(id, "Caller", "caller@example.com", null, null, "hash", role, UserStatus.ACTIVE, false,
				role == UserRole.TEACHER ? "IELTS" : null,
				role == UserRole.STUDENT ? "HV" + id : null, null, null);
	}
}