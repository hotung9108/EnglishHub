package com.english_hub.core.modules.classroom.application.service;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.security.ApiRoutePolicy;
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
import com.english_hub.core.modules.user.application.port.CurrentUserProvider.AuthenticatedIdentity;
import com.english_hub.core.modules.user.domain.model.User;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.function.Executable;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.InOrder;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;
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
		lenient().when(currentUserProvider.requireActiveUser()).thenReturn(user(1L, UserRole.ADMIN));
		lenient().when(currentUserProvider.requireAuthenticatedIdentity())
				.thenReturn(new AuthenticatedIdentity(1L, UserRole.ADMIN));
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
	void allowsAStudentToReadAClassTheyBelongTo() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(41L, UserRole.STUDENT));
		when(classRepository.findById(3L)).thenReturn(Optional.of(classWithTeacher(3L)));
		when(classMemberRepository.existsByClassIdAndStudentId(3L, 41L)).thenReturn(true);
		when(classRepository.findTeacher(12L)).thenReturn(Optional.of(new TeacherInfo(12L, "Teacher")));
		when(classMemberRepository.countByClassId(3L)).thenReturn(1L);

		ClassDetailResult result = classService.getClassDetail(3L);

		assertThat(result.memberCount()).isEqualTo(1L);
		verify(classMemberRepository).existsByClassIdAndStudentId(3L, 41L);
	}

	@Test
	void rejectsAStudentWhoDoesNotBelongToTheClass() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(41L, UserRole.STUDENT));
		when(classRepository.findById(3L)).thenReturn(Optional.of(classWithTeacher(3L)));
		when(classMemberRepository.existsByClassIdAndStudentId(3L, 41L)).thenReturn(false);

		assertThatThrownBy(() -> classService.getClassDetail(3L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Bạn không có quyền thực hiện thao tác này.");
		verify(classRepository, never()).findTeacher(anyLong());
		verify(classMemberRepository, never()).countByClassId(anyLong());
	}

	@Test
	void returnsNotFoundBeforeCheckingStudentMembershipForAnUnknownClass() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(41L, UserRole.STUDENT));
		when(classRepository.findById(404L)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> classService.getClassDetail(404L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không tìm thấy lớp học.");
		verify(classMemberRepository, never()).existsByClassIdAndStudentId(anyLong(), anyLong());
	}

	@Test
	void requiresAnActiveCallerBeforeLookingUpClassDetails() {
		when(currentUserProvider.requireActiveUser()).thenThrow(ApiException.unauthorized("Token không hợp lệ."));

		assertThatThrownBy(() -> classService.getClassDetail(3L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Token không hợp lệ.");
		verify(classRepository, never()).findById(anyLong());
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
		verify(classRepository, never()).existsByNameIgnoreCase(any());
		verify(classRepository, never()).save(any(EnglishClass.class));
	}

	@Test
	void rejectsAClassNameThatAlreadyExistsAfterTrimming() {
		when(classRepository.existsByNameIgnoreCase("Existing Class")).thenReturn(true);

		assertThatThrownBy(() -> classService.createClass(new CreateClassCommand(
				"  Existing Class  ", null, null, LocalDate.of(2026, 9, 15), null, null)))
				.isInstanceOf(ApiException.class)
				.hasMessage("Tên lớp đã tồn tại.");
		verify(classRepository).existsByNameIgnoreCase("Existing Class");
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
		when(classRepository.findById(3L)).thenReturn(Optional.of(classWithTeacher(3L)));
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
	void allowsAStudentToListMembersOfAClassTheyBelongTo() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(41L, UserRole.STUDENT));
		when(classRepository.findById(3L)).thenReturn(Optional.of(classWithTeacher(3L)));
		when(classMemberRepository.existsByClassIdAndStudentId(3L, 41L)).thenReturn(true);
		when(classMemberRepository.findMembersWithStudentInfo(3L)).thenReturn(List.of());

		assertThat(classService.listClassMembers(3L)).isEmpty();
		verify(classMemberRepository).existsByClassIdAndStudentId(3L, 41L);
	}

	@Test
	void rejectsAStudentWhoListsMembersOfAClassTheyDoNotBelongTo() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(41L, UserRole.STUDENT));
		when(classRepository.findById(3L)).thenReturn(Optional.of(classWithTeacher(3L)));
		when(classMemberRepository.existsByClassIdAndStudentId(3L, 41L)).thenReturn(false);

		assertThatThrownBy(() -> classService.listClassMembers(3L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Bạn không có quyền thực hiện thao tác này.");
		verify(classMemberRepository, never()).findMembersWithStudentInfo(anyLong());
	}

	@Test
	void returnsNotFoundBeforeCheckingStudentMembershipForAnUnknownRoster() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(41L, UserRole.STUDENT));
		when(classRepository.findById(404L)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> classService.listClassMembers(404L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không tìm thấy lớp học.");
		verify(classMemberRepository, never()).existsByClassIdAndStudentId(anyLong(), anyLong());
	}

	@Test
	void requiresAnActiveCallerBeforeLookingUpAClassRoster() {
		when(currentUserProvider.requireActiveUser()).thenThrow(ApiException.unauthorized("Token không hợp lệ."));

		assertThatThrownBy(() -> classService.listClassMembers(3L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Token không hợp lệ.");
		verify(classRepository, never()).existsById(anyLong());
	}

	@Test
	void returnsAnEmptyRosterForAClassWithoutMembers() {
		when(classRepository.findById(3L)).thenReturn(Optional.of(classWithTeacher(3L)));
		when(classMemberRepository.findMembersWithStudentInfo(3L)).thenReturn(List.of());

		assertThat(classService.listClassMembers(3L)).isEmpty();
	}

	@Test
	void rejectsListingMembersForAnUnknownClass() {
		when(classRepository.findById(404L)).thenReturn(Optional.empty());

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

	@ParameterizedTest
	@ValueSource(booleans = {true, false})
	void memberWriteRoutesAllowOnlyAdminAndTeacher(boolean addingMember) {
		HttpMethod method = addingMember ? HttpMethod.POST : HttpMethod.DELETE;
		String path = addingMember
				? "/api/v1/classes/{id}/members"
				: "/api/v1/classes/{id}/members/{memberId}";

		List<ApiRoutePolicy.RouteRule> rules = ApiRoutePolicy.routes().stream()
				.filter(rule -> rule.method() == method && rule.pathPattern().equals(path))
				.toList();

		assertThat(rules).hasSize(1);
		assertThat(rules.getFirst().roles()).containsExactly("ADMIN", "TEACHER");
	}

	@Test
	void owningTeacherAddsAMemberAfterCheckingAccessAndExistingBusinessRules() {
		givenTeacherIdentity();
		when(classRepository.findById(2L)).thenReturn(Optional.of(classOwnedByTeacher(2L, 4L)));
		when(classRepository.existsById(2L)).thenReturn(true);
		when(classRepository.studentExists(13L)).thenReturn(true);
		when(classMemberRepository.existsByClassIdAndStudentId(2L, 13L)).thenReturn(false);
		givenNewMemberId();

		long memberId = classService.addClassMember(2L, new AddClassMemberCommand(13L));

		assertThat(memberId).isEqualTo(21L);
		InOrder order = inOrder(currentUserProvider, classRepository, classMemberRepository);
		order.verify(currentUserProvider).requireAuthenticatedIdentity();
		order.verify(currentUserProvider).requireActiveUser();
		order.verify(classRepository).findById(2L);
		order.verify(classRepository).existsById(2L);
		order.verify(classRepository).studentExists(13L);
		order.verify(classMemberRepository).existsByClassIdAndStudentId(2L, 13L);
		ArgumentCaptor<ClassMember> captor = ArgumentCaptor.forClass(ClassMember.class);
		order.verify(classMemberRepository).save(captor.capture());
		assertThat(captor.getValue().getClassId()).isEqualTo(2L);
		assertThat(captor.getValue().getStudentId()).isEqualTo(13L);
		order.verifyNoMoreInteractions();
	}

	@Test
	void owningTeacherRemovesAMemberAfterCheckingAccess() {
		givenTeacherIdentity();
		when(classRepository.findById(2L)).thenReturn(Optional.of(classOwnedByTeacher(2L, 4L)));
		ClassMember member = new ClassMember(2L, 61L);
		member.setId(21L);
		when(classMemberRepository.findByClassIdAndId(2L, 21L)).thenReturn(Optional.of(member));

		classService.removeClassMember(2L, 21L);

		InOrder order = inOrder(currentUserProvider, classRepository, classMemberRepository);
		order.verify(currentUserProvider).requireAuthenticatedIdentity();
		order.verify(currentUserProvider).requireActiveUser();
		order.verify(classRepository).findById(2L);
		order.verify(classMemberRepository).findByClassIdAndId(2L, 21L);
		order.verify(classMemberRepository).deleteById(21L);
		order.verifyNoMoreInteractions();
	}

	@ParameterizedTest(name = "{0}")
	@MethodSource("forbiddenTeacherCommands")
	void nonOwningTeacherIsRejectedBeforeInputAndStudentChecks(String scenario, AddClassMemberCommand command) {
		givenTeacherIdentity();
		when(classRepository.findById(1L)).thenReturn(Optional.of(classOwnedByTeacher(1L, 9L)));

		assertApiError(() -> classService.addClassMember(1L, command), HttpStatus.FORBIDDEN,
				"Bạn không có quyền thực hiện thao tác này.");

		verify(classRepository).findById(1L);
		verifyNoMoreInteractions(classRepository);
		verifyNoInteractions(classMemberRepository);
	}

	private static Stream<Arguments> forbiddenTeacherCommands() {
		return Stream.of(
				Arguments.of("null command", (AddClassMemberCommand) null),
				Arguments.of("missing student ID", new AddClassMemberCommand(null)),
				Arguments.of("unenrolled student", new AddClassMemberCommand(13L)),
				Arguments.of("student absent from snapshot", new AddClassMemberCommand(92L)),
				Arguments.of("student already in the other teacher's class", new AddClassMemberCommand(80L)));
	}

	@Test
	void nonOwningTeacherCannotLookUpOrDeleteAMember() {
		givenTeacherIdentity();
		when(classRepository.findById(1L)).thenReturn(Optional.of(classOwnedByTeacher(1L, 9L)));

		assertApiError(() -> classService.removeClassMember(1L, 1L), HttpStatus.FORBIDDEN,
				"Bạn không có quyền thực hiện thao tác này.");

		verify(classRepository).findById(1L);
		verifyNoMoreInteractions(classRepository);
		verifyNoInteractions(classMemberRepository);
	}

	@ParameterizedTest
	@ValueSource(booleans = {true, false})
	void teacherCannotWriteMembersOfAnUnassignedClass(boolean addingMember) {
		givenTeacherIdentity();
		when(classRepository.findById(6L)).thenReturn(Optional.of(classOwnedByTeacher(6L, null)));

		assertApiError(() -> writeMember(addingMember, 6L), HttpStatus.FORBIDDEN,
				"Bạn không có quyền thực hiện thao tác này.");

		verify(classRepository).findById(6L);
		verifyNoMoreInteractions(classRepository);
		verifyNoInteractions(classMemberRepository);
	}

	@ParameterizedTest
	@ValueSource(booleans = {true, false})
	void teacherGetsClassNotFoundBeforeAnyMemberBusinessRules(boolean addingMember) {
		givenTeacherIdentity();
		when(classRepository.findById(7L)).thenReturn(Optional.empty());

		assertApiError(() -> writeMember(addingMember, 7L), HttpStatus.NOT_FOUND,
				"Không tìm thấy lớp học.");

		verify(classRepository).findById(7L);
		verifyNoMoreInteractions(classRepository);
		verifyNoInteractions(classMemberRepository);
	}

	@ParameterizedTest(name = "{0}")
	@MethodSource("inactiveTeacherWrites")
	void inactiveTeacherCannotReachClassOrMemberRepositories(String scenario, boolean addingMember) {
		when(currentUserProvider.requireAuthenticatedIdentity())
				.thenReturn(new AuthenticatedIdentity(4L, UserRole.TEACHER));
		when(currentUserProvider.requireActiveUser()).thenThrow(
				ApiException.unauthorized("Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn."));

		assertApiError(() -> writeMember(addingMember, 2L), HttpStatus.UNAUTHORIZED,
				"Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.");

		verifyNoInteractions(classRepository, classMemberRepository);
	}

	private static Stream<Arguments> inactiveTeacherWrites() {
		return Stream.of(
				Arguments.of("locked teacher POST", true),
				Arguments.of("locked teacher DELETE", false),
				Arguments.of("deleted teacher POST", true),
				Arguments.of("deleted teacher DELETE", false));
	}

	@ParameterizedTest
	@EnumSource(value = UserRole.class, names = {"ADMIN", "STUDENT"})
	void teacherTokenCannotWriteAfterTheCurrentUserRoleChanges(UserRole currentRole) {
		givenTeacherIdentity();
		when(currentUserProvider.requireActiveUser()).thenReturn(user(4L, currentRole));

		assertApiError(() -> classService.addClassMember(2L, new AddClassMemberCommand(13L)),
				HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này.");
		assertApiError(() -> classService.removeClassMember(2L, 21L),
				HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này.");

		verifyNoInteractions(classRepository, classMemberRepository);
	}

	@Test
	void teacherWithoutAUserIdCannotWriteMembers() {
		givenTeacherIdentity();
		User teacher = user(4L, UserRole.TEACHER);
		teacher.setId(null);
		when(currentUserProvider.requireActiveUser()).thenReturn(teacher);

		assertApiError(() -> classService.addClassMember(2L, new AddClassMemberCommand(13L)),
				HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này.");
		assertApiError(() -> classService.removeClassMember(2L, 21L),
				HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này.");

		verifyNoInteractions(classRepository, classMemberRepository);
	}

	@Test
	void owningTeacherCannotDeleteAMemberFromAnotherClass() {
		givenTeacherIdentity();
		when(classRepository.findById(2L)).thenReturn(Optional.of(classOwnedByTeacher(2L, 4L)));
		when(classMemberRepository.findByClassIdAndId(2L, 1L)).thenReturn(Optional.empty());

		assertApiError(() -> classService.removeClassMember(2L, 1L), HttpStatus.NOT_FOUND,
				"Không tìm thấy thành viên trong lớp.");

		verify(classMemberRepository).findByClassIdAndId(2L, 1L);
		verifyNoMoreInteractions(classMemberRepository);
	}

	@Test
	void owningTeacherAddsOnlyTheRequestedClassMembershipForAStudentInAnotherClass() {
		givenTeacherIdentity();
		when(classRepository.findById(2L)).thenReturn(Optional.of(classOwnedByTeacher(2L, 4L)));
		when(classRepository.existsById(2L)).thenReturn(true);
		when(classRepository.studentExists(80L)).thenReturn(true);
		when(classMemberRepository.existsByClassIdAndStudentId(2L, 80L)).thenReturn(false);
		givenNewMemberId();

		assertThat(classService.addClassMember(2L, new AddClassMemberCommand(80L))).isEqualTo(21L);

		verify(classMemberRepository).existsByClassIdAndStudentId(2L, 80L);
		ArgumentCaptor<ClassMember> captor = ArgumentCaptor.forClass(ClassMember.class);
		verify(classMemberRepository).save(captor.capture());
		assertThat(captor.getValue().getClassId()).isEqualTo(2L);
		assertThat(captor.getValue().getStudentId()).isEqualTo(80L);
		verifyNoMoreInteractions(classMemberRepository);
	}

	@ParameterizedTest
	@EnumSource(value = UserRole.class, names = "STUDENT")
	@NullSource
	void unsupportedIdentityRolesCannotWriteMembers(UserRole role) {
		when(currentUserProvider.requireAuthenticatedIdentity()).thenReturn(new AuthenticatedIdentity(13L, role));

		assertApiError(() -> classService.addClassMember(2L, new AddClassMemberCommand(13L)),
				HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này.");
		assertApiError(() -> classService.removeClassMember(2L, 21L),
				HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này.");

		verify(currentUserProvider, never()).requireActiveUser();
		verifyNoInteractions(classRepository, classMemberRepository);
	}

	@ParameterizedTest
	@ValueSource(booleans = {true, false})
	void adminValidatesInputBeforeLookingUpAnAbsentClass(boolean nullCommand) {
		AddClassMemberCommand command = nullCommand ? null : new AddClassMemberCommand(null);

		assertApiError(() -> classService.addClassMember(7L, command), HttpStatus.BAD_REQUEST,
				"Thiếu mã học viên.");

		verifyAdminGuardDoesNotLoadUserOrClass();
		verifyNoInteractions(classRepository, classMemberRepository);
	}

	@Test
	void adminGetsTheOriginalCombinedErrorForAnAbsentClassWithoutLookingUpTheStudent() {
		when(classRepository.existsById(7L)).thenReturn(false);

		assertApiError(() -> classService.addClassMember(7L, new AddClassMemberCommand(13L)),
				HttpStatus.NOT_FOUND, "Không tìm thấy lớp học hoặc học viên.");

		verifyAdminGuardDoesNotLoadUserOrClass();
		verify(classRepository).existsById(7L);
		verifyNoMoreInteractions(classRepository);
		verifyNoInteractions(classMemberRepository);
	}

	@Test
	void adminChecksClassBeforeReturningTheOriginalUnknownStudentError() {
		when(classRepository.existsById(2L)).thenReturn(true);
		when(classRepository.studentExists(92L)).thenReturn(false);

		assertApiError(() -> classService.addClassMember(2L, new AddClassMemberCommand(92L)),
				HttpStatus.NOT_FOUND, "Không tìm thấy lớp học hoặc học viên.");

		verifyAdminGuardDoesNotLoadUserOrClass();
		InOrder order = inOrder(classRepository);
		order.verify(classRepository).existsById(2L);
		order.verify(classRepository).studentExists(92L);
		order.verifyNoMoreInteractions();
		verifyNoInteractions(classMemberRepository);
	}

	@Test
	void adminChecksClassAndStudentBeforeReturningTheOriginalDuplicateError() {
		when(classRepository.existsById(1L)).thenReturn(true);
		when(classRepository.studentExists(80L)).thenReturn(true);
		when(classMemberRepository.existsByClassIdAndStudentId(1L, 80L)).thenReturn(true);

		assertApiError(() -> classService.addClassMember(1L, new AddClassMemberCommand(80L)),
				HttpStatus.CONFLICT, "Học viên đã có trong lớp.");

		verifyAdminGuardDoesNotLoadUserOrClass();
		InOrder order = inOrder(classRepository, classMemberRepository);
		order.verify(classRepository).existsById(1L);
		order.verify(classRepository).studentExists(80L);
		order.verify(classMemberRepository).existsByClassIdAndStudentId(1L, 80L);
		order.verifyNoMoreInteractions();
	}

	@ParameterizedTest(name = "class {0}, member {1}")
	@MethodSource("adminMissingMembers")
	void adminKeepsTheMemberErrorWithoutLookingUpTheClass(long classId, long memberId) {
		when(classMemberRepository.findByClassIdAndId(classId, memberId)).thenReturn(Optional.empty());

		assertApiError(() -> classService.removeClassMember(classId, memberId), HttpStatus.NOT_FOUND,
				"Không tìm thấy thành viên trong lớp.");

		verifyAdminGuardDoesNotLoadUserOrClass();
		verifyNoInteractions(classRepository);
		verify(classMemberRepository).findByClassIdAndId(classId, memberId);
		verifyNoMoreInteractions(classMemberRepository);
	}

	private static Stream<Arguments> adminMissingMembers() {
		return Stream.of(Arguments.of(7L, 1L), Arguments.of(2L, 1L));
	}

	@Test
	void adminAddsAMemberWithoutLoadingTheCurrentUserOrClass() {
		when(classRepository.existsById(2L)).thenReturn(true);
		when(classRepository.studentExists(13L)).thenReturn(true);
		when(classMemberRepository.existsByClassIdAndStudentId(2L, 13L)).thenReturn(false);
		givenNewMemberId();

		assertThat(classService.addClassMember(2L, new AddClassMemberCommand(13L))).isEqualTo(21L);

		verifyAdminGuardDoesNotLoadUserOrClass();
		InOrder order = inOrder(classRepository, classMemberRepository);
		order.verify(classRepository).existsById(2L);
		order.verify(classRepository).studentExists(13L);
		order.verify(classMemberRepository).existsByClassIdAndStudentId(2L, 13L);
		ArgumentCaptor<ClassMember> captor = ArgumentCaptor.forClass(ClassMember.class);
		order.verify(classMemberRepository).save(captor.capture());
		assertThat(captor.getValue().getClassId()).isEqualTo(2L);
		assertThat(captor.getValue().getStudentId()).isEqualTo(13L);
		order.verifyNoMoreInteractions();
	}

	@Test
	void adminRemovesAMemberWithoutLoadingTheCurrentUserOrClass() {
		ClassMember member = new ClassMember(2L, 61L);
		member.setId(21L);
		when(classMemberRepository.findByClassIdAndId(2L, 21L)).thenReturn(Optional.of(member));

		classService.removeClassMember(2L, 21L);

		verifyAdminGuardDoesNotLoadUserOrClass();
		verifyNoInteractions(classRepository);
		InOrder order = inOrder(classMemberRepository);
		order.verify(classMemberRepository).findByClassIdAndId(2L, 21L);
		order.verify(classMemberRepository).deleteById(21L);
		order.verifyNoMoreInteractions();
	}

	@Test
	void owningTeacherReadsClassDetailsAfterOneClassLookupAndBeforeRelatedDataQueries() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(4L, UserRole.TEACHER));
		EnglishClass englishClass = classOwnedByTeacher(2L, 4L);
		TeacherInfo teacherInfo = mock(TeacherInfo.class);
		when(classRepository.findById(2L)).thenReturn(Optional.of(englishClass));
		when(classRepository.findTeacher(4L)).thenReturn(Optional.of(teacherInfo));
		when(classMemberRepository.countByClassId(2L)).thenReturn(1L);

		ClassDetailResult result = classService.getClassDetail(2L);

		assertThat(result.englishClass()).isSameAs(englishClass);
		assertThat(result.teacher()).isSameAs(teacherInfo);
		assertThat(result.memberCount()).isEqualTo(1L);
		InOrder order = inOrder(currentUserProvider, classRepository, classMemberRepository);
		order.verify(currentUserProvider).requireActiveUser();
		order.verify(classRepository).findById(2L);
		order.verify(classRepository).findTeacher(4L);
		order.verify(classMemberRepository).countByClassId(2L);
		verifyNoMoreInteractions(currentUserProvider, classRepository, classMemberRepository);
	}

	@Test
	void owningTeacherReadsTheExactRosterAfterOneClassLookupWithoutAnExistenceQuery() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(4L, UserRole.TEACHER));
		when(classRepository.findById(2L)).thenReturn(Optional.of(classOwnedByTeacher(2L, 4L)));
		List<ClassMemberDetail> expected = List.of(mock(ClassMemberDetail.class));
		when(classMemberRepository.findMembersWithStudentInfo(2L)).thenReturn(expected);

		assertThat(classService.listClassMembers(2L)).isSameAs(expected);

		InOrder order = inOrder(currentUserProvider, classRepository, classMemberRepository);
		order.verify(currentUserProvider).requireActiveUser();
		order.verify(classRepository).findById(2L);
		order.verify(classMemberRepository).findMembersWithStudentInfo(2L);
		verifyNoMoreInteractions(currentUserProvider, classRepository, classMemberRepository);
	}

	@ParameterizedTest(name = "roster={0}")
	@ValueSource(booleans = {false, true})
	void nonOwningTeacherCannotReadTheClassOrAnyRelatedData(boolean readingMembers) {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(4L, UserRole.TEACHER));
		when(classRepository.findById(1L)).thenReturn(Optional.of(classOwnedByTeacher(1L, 9L)));

		assertApiError(() -> readClass(readingMembers, 1L), HttpStatus.FORBIDDEN,
				"Bạn không có quyền thực hiện thao tác này.");

		verify(classRepository).findById(1L);
		verifyNoMoreInteractions(classRepository);
		verifyNoInteractions(classMemberRepository);
	}

	@ParameterizedTest(name = "roster={0}")
	@ValueSource(booleans = {false, true})
	void teacherCannotReadAnUnassignedClassOrAnyRelatedData(boolean readingMembers) {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(4L, UserRole.TEACHER));
		when(classRepository.findById(6L)).thenReturn(Optional.of(classOwnedByTeacher(6L, null)));

		assertApiError(() -> readClass(readingMembers, 6L), HttpStatus.FORBIDDEN,
				"Bạn không có quyền thực hiện thao tác này.");

		verify(classRepository).findById(6L);
		verifyNoMoreInteractions(classRepository);
		verifyNoInteractions(classMemberRepository);
	}

	@ParameterizedTest(name = "{0}, roster={1}")
	@MethodSource("readRolesAndEndpoints")
	void classReadsKeepTheOriginalNotFoundErrorBeforeAnyAccessOrRelatedDataQuery(
			UserRole role, boolean readingMembers) {
		long callerId = switch (role) {
			case ADMIN -> 1L;
			case TEACHER -> 4L;
			case STUDENT -> 61L;
		};
		when(currentUserProvider.requireActiveUser()).thenReturn(user(callerId, role));
		when(classRepository.findById(7L)).thenReturn(Optional.empty());

		assertApiError(() -> readClass(readingMembers, 7L), HttpStatus.NOT_FOUND,
				"Không tìm thấy lớp học.");

		verify(classRepository).findById(7L);
		verifyNoMoreInteractions(classRepository);
		verifyNoInteractions(classMemberRepository);
	}

	private static Stream<Arguments> readRolesAndEndpoints() {
		return Stream.of(
				Arguments.of(UserRole.ADMIN, false), Arguments.of(UserRole.ADMIN, true),
				Arguments.of(UserRole.TEACHER, false), Arguments.of(UserRole.TEACHER, true),
				Arguments.of(UserRole.STUDENT, false), Arguments.of(UserRole.STUDENT, true));
	}

	@ParameterizedTest(name = "teacherAssigned={0}")
	@ValueSource(booleans = {false, true})
	void adminReadsClassDetailsWithoutOwnershipEvenWhenNoTeacherIsAssigned(boolean teacherAssigned) {
		long classId = teacherAssigned ? 2L : 6L;
		EnglishClass englishClass = classOwnedByTeacher(classId, teacherAssigned ? 4L : null);
		when(classRepository.findById(classId)).thenReturn(Optional.of(englishClass));
		TeacherInfo teacherInfo = null;
		if (teacherAssigned) {
			teacherInfo = mock(TeacherInfo.class);
			when(classRepository.findTeacher(4L)).thenReturn(Optional.of(teacherInfo));
		}
		when(classMemberRepository.countByClassId(classId)).thenReturn(1L);

		ClassDetailResult result = classService.getClassDetail(classId);

		assertThat(result.englishClass()).isSameAs(englishClass);
		assertThat(result.teacher()).isSameAs(teacherInfo);
		assertThat(result.memberCount()).isEqualTo(1L);
		verify(classRepository).findById(classId);
		if (teacherAssigned) {
			verify(classRepository).findTeacher(4L);
		}
		verify(classMemberRepository).countByClassId(classId);
		verifyNoMoreInteractions(classRepository, classMemberRepository);
	}

	@ParameterizedTest(name = "teacherAssigned={0}")
	@ValueSource(booleans = {false, true})
	void adminReadsTheExactRosterWithoutOwnershipEvenWhenNoTeacherIsAssigned(boolean teacherAssigned) {
		long classId = teacherAssigned ? 2L : 6L;
		when(classRepository.findById(classId))
				.thenReturn(Optional.of(classOwnedByTeacher(classId, teacherAssigned ? 4L : null)));
		List<ClassMemberDetail> expected = List.of(mock(ClassMemberDetail.class));
		when(classMemberRepository.findMembersWithStudentInfo(classId)).thenReturn(expected);

		assertThat(classService.listClassMembers(classId)).isSameAs(expected);

		verify(classRepository).findById(classId);
		verify(classMemberRepository).findMembersWithStudentInfo(classId);
		verifyNoMoreInteractions(classRepository, classMemberRepository);
	}

	@ParameterizedTest(name = "class={0}, student={1}")
	@MethodSource("studentClassReads")
	void memberStudentKeepsClassDetailAccessIncludingAnUnassignedClass(
			long classId, long studentId, Long teacherId) {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(studentId, UserRole.STUDENT));
		EnglishClass englishClass = classOwnedByTeacher(classId, teacherId);
		when(classRepository.findById(classId)).thenReturn(Optional.of(englishClass));
		when(classMemberRepository.existsByClassIdAndStudentId(classId, studentId)).thenReturn(true);
		when(classMemberRepository.countByClassId(classId)).thenReturn(1L);
		TeacherInfo teacherInfo = null;
		if (teacherId != null) {
			teacherInfo = mock(TeacherInfo.class);
			when(classRepository.findTeacher(teacherId)).thenReturn(Optional.of(teacherInfo));
		}

		ClassDetailResult result = classService.getClassDetail(classId);

		assertThat(result.englishClass()).isSameAs(englishClass);
		assertThat(result.teacher()).isSameAs(teacherInfo);
		assertThat(result.memberCount()).isEqualTo(1L);
		verify(classRepository).findById(classId);
		if (teacherId != null) {
			verify(classRepository).findTeacher(teacherId);
		}
		verify(classMemberRepository).existsByClassIdAndStudentId(classId, studentId);
		verify(classMemberRepository).countByClassId(classId);
		verifyNoMoreInteractions(classRepository, classMemberRepository);
	}

	@ParameterizedTest(name = "class={0}, student={1}")
	@MethodSource("studentClassReads")
	void memberStudentKeepsRosterAccessIncludingAnUnassignedClass(
			long classId, long studentId, Long teacherId) {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(studentId, UserRole.STUDENT));
		when(classRepository.findById(classId)).thenReturn(Optional.of(classOwnedByTeacher(classId, teacherId)));
		when(classMemberRepository.existsByClassIdAndStudentId(classId, studentId)).thenReturn(true);
		List<ClassMemberDetail> expected = List.of(mock(ClassMemberDetail.class));
		when(classMemberRepository.findMembersWithStudentInfo(classId)).thenReturn(expected);

		assertThat(classService.listClassMembers(classId)).isSameAs(expected);

		verify(classRepository).findById(classId);
		verify(classMemberRepository).existsByClassIdAndStudentId(classId, studentId);
		verify(classMemberRepository).findMembersWithStudentInfo(classId);
		verifyNoMoreInteractions(classRepository, classMemberRepository);
	}

	private static Stream<Arguments> studentClassReads() {
		return Stream.of(Arguments.of(2L, 61L, 4L), Arguments.of(6L, 38L, null));
	}

	@ParameterizedTest(name = "roster={0}")
	@ValueSource(booleans = {false, true})
	void nonMemberStudentKeepsTheOriginalForbiddenErrorBeforeRelatedDataQueries(boolean readingMembers) {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(13L, UserRole.STUDENT));
		when(classRepository.findById(2L)).thenReturn(Optional.of(classOwnedByTeacher(2L, 4L)));
		when(classMemberRepository.existsByClassIdAndStudentId(2L, 13L)).thenReturn(false);

		assertApiError(() -> readClass(readingMembers, 2L), HttpStatus.FORBIDDEN,
				"Bạn không có quyền thực hiện thao tác này.");

		verify(classRepository).findById(2L);
		verifyNoMoreInteractions(classRepository);
		verify(classMemberRepository).existsByClassIdAndStudentId(2L, 13L);
		verifyNoMoreInteractions(classMemberRepository);
	}

	private void readClass(boolean readingMembers, long classId) {
		if (readingMembers) {
			classService.listClassMembers(classId);
		} else {
			classService.getClassDetail(classId);
		}
	}

	private void givenTeacherIdentity() {
		when(currentUserProvider.requireAuthenticatedIdentity()).thenReturn(new AuthenticatedIdentity(4L, UserRole.TEACHER));
		when(currentUserProvider.requireActiveUser()).thenReturn(user(4L, UserRole.TEACHER));
	}

	private EnglishClass classOwnedByTeacher(long classId, Long teacherId) {
		EnglishClass englishClass = classWithTeacher(classId);
		englishClass.setTeacherId(teacherId);
		return englishClass;
	}

	private void givenNewMemberId() {
		when(classMemberRepository.save(any(ClassMember.class))).thenAnswer(invocation -> {
			ClassMember member = invocation.getArgument(0);
			member.setId(21L);
			return member;
		});
	}

	private void writeMember(boolean addingMember, long classId) {
		if (addingMember) {
			classService.addClassMember(classId, new AddClassMemberCommand(13L));
		} else {
			classService.removeClassMember(classId, 1L);
		}
	}

	private void verifyAdminGuardDoesNotLoadUserOrClass() {
		verify(currentUserProvider).requireAuthenticatedIdentity();
		verify(currentUserProvider, never()).requireActiveUser();
		verify(classRepository, never()).findById(anyLong());
	}

	private void assertApiError(Executable action, HttpStatus status, String message) {
		ApiException exception = assertThrows(ApiException.class, action);
		assertThat(exception.getStatus()).isEqualTo(status);
		assertThat(exception).hasMessage(message);
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
