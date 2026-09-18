package com.english_hub.backend.features.user.application.service;

import com.english_hub.backend.common.application.IService;
import com.english_hub.backend.features.user.application.dto.UserDto;

/** User-specific CRUD contract built on the shared service abstraction. */
public interface UserService extends IService<com.english_hub.backend.features.user.domain.model.User, UserDto> {
}
