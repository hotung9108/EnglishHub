package com.english_hub.core.modules.classroom.application.service;

import com.english_hub.core.modules.classroom.domain.repository.ClassMemberRepository;
import com.english_hub.core.modules.classroom.domain.repository.ClassRepository;
import com.english_hub.core.modules.user.application.port.CurrentUserProvider;
import org.springframework.stereotype.Service;

@Service
public class ClassService {

	private final ClassRepository classRepository;
	private final ClassMemberRepository classMemberRepository;
	private final CurrentUserProvider currentUserProvider;

	public ClassService(
			ClassRepository classRepository,
			ClassMemberRepository classMemberRepository,
			CurrentUserProvider currentUserProvider) {
		this.classRepository = classRepository;
		this.classMemberRepository = classMemberRepository;
		this.currentUserProvider = currentUserProvider;
	}
}