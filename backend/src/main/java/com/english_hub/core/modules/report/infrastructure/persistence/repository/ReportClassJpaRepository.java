package com.english_hub.core.modules.report.infrastructure.persistence.repository;

import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassEntity;
import com.english_hub.core.modules.report.domain.model.ReportClassRow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReportClassJpaRepository extends JpaRepository<ClassEntity, Long> {

	@Query(value = """
			select new com.english_hub.core.modules.report.domain.model.ReportClassRow(
				c.id, c.name, c.status)
			from ClassEntity c
			where (:teacherId is null or c.teacherId = :teacherId)
			  and (c.teacherId is null or exists (
				  select t.id from User t where t.id = c.teacherId and t.deleted = false))
			order by c.id desc
			""",
		countQuery = """
			select count(c.id)
			from ClassEntity c
			where (:teacherId is null or c.teacherId = :teacherId)
			  and (c.teacherId is null or exists (
				  select t.id from User t where t.id = c.teacherId and t.deleted = false))
			""")
	Page<ReportClassRow> findClassPage(@Param("teacherId") Long teacherId, Pageable pageable);

	@Query("""
			select c.id
			from ClassEntity c
			where (:teacherId is null or c.teacherId = :teacherId)
			  and (:classId is null or c.id = :classId)
			  and (c.teacherId is null or exists (
				  select t.id from User t where t.id = c.teacherId and t.deleted = false))
			order by c.id
			""")
	List<Long> findClassIds(
			@Param("teacherId") Long teacherId,
			@Param("classId") Long classId);
}
