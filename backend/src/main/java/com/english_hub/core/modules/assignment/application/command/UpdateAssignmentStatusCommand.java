package com.english_hub.core.modules.assignment.application.command;

import java.time.OffsetDateTime;

public record UpdateAssignmentStatusCommand(String status, OffsetDateTime closeAt) {
}
