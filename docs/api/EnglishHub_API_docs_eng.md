# EnglishHub API Documentation

> **Base URL:** `http://localhost:8080`  
> **Version:** v1  
> **Auth:** Bearer JWT token (header: `Authorization: Bearer <token>`)  
> **Description:** REST API for the English assignment management & grading platform.

---

## Table of Contents

1. [Auth](#1-auth)
2. [User (Self)](#2-user-self)
3. [Admin – User Management](#3-admin--user-management)
4. [Class](#4-class)
5. [Assignment](#5-assignment)
6. [Module](#6-module)
7. [Question](#7-question)
8. [Submission](#8-submission)
9. [Submission Module](#9-submission-module)
10. [Grading](#10-grading)
11. [Annotations](#11-annotations)
12. [Student Evaluation](#12-student-evaluation)
13. [DTO Objects](#13-dto-objects)

---

## 1. Auth

### POST `/api/v1/auth/login`
Log in and retrieve access token and refresh token.

**Request Body:** `LoginRequest`

**Response:** `AuthResponse`

---

### POST `/api/v1/auth/refresh`
Renew the access token using a refresh token.

**Request Body:** `RefreshRequest`

**Response:** `RefreshResponse`

---

### POST `/api/v1/auth/logout`
Log out and invalidate the refresh token.

**Request Body:** `LogoutRequest`

**Response:** `LogoutResponse`

---

## 2. User (Self)

### GET `/api/v1/users/me`
Retrieve the profile of the currently authenticated user.

**Response:** `UserResponse`

---

### PUT `/api/v1/users/me`
Update the profile of the currently authenticated user.

**Request Body:** `UpdateOwnProfileRequest`

**Response:** `MessageResponse`

---

### PATCH `/api/v1/users/me/password`
Change the password of the currently authenticated user.

**Request Body:** `ChangePasswordRequest`

**Response:** `MessageResponse`

---

## 3. Admin – User Management

### GET `/api/v1/admin/users`
Retrieve a paginated list of all users with optional search and filtering.

**Query Params:**

| Name | Type | Description |
|------|------|-------------|
| `q` | string | Search keyword |
| `role` | string | Filter by role |
| `page` | integer | Page number |
| `limit` | integer | Records per page |

**Response:** `AdminUserListResponse`

---

### POST `/api/v1/admin/users`
Create a new user.

**Request Body:** `CreateUserRequest`

**Response:** `CreatedUserResponse`

---

### PUT `/api/v1/admin/users/{id}`
Update a user's information by ID.

**Path Params:** `id` (int64)

**Request Body:** `UpdateUserRequest`

**Response:** `MessageResponse`

---

### DELETE `/api/v1/admin/users/{id}`
Delete a user by ID.

**Path Params:** `id` (int64)

**Response:** `MessageResponse`

---

### PATCH `/api/v1/admin/users/{id}/status`
Update a user's account status (active/inactive/etc.).

**Path Params:** `id` (int64)

**Request Body:** `UpdateUserStatusRequest`

**Response:** `MessageResponse`

---

## 4. Class

### GET `/api/v1/classes`
Retrieve a paginated list of classes with optional status filtering.

**Query Params:**

| Name | Type | Description |
|------|------|-------------|
| `status` | string | Filter by class status |
| `page` | integer | Page number |
| `limit` | integer | Records per page |

**Response:** `ClassListResponse`

---

### POST `/api/v1/classes`
Create a new class.

**Request Body:** `CreateClassRequest`

**Response:** `CreatedClassResponse`

---

### GET `/api/v1/classes/{id}`
Retrieve class details.

**Path Params:** `id` (int64)

**Response:** `ClassDetailResponse`

---

### PUT `/api/v1/classes/{id}`
Update class information.

**Path Params:** `id` (int64)

**Request Body:** `UpdateClassRequest`

**Response:** `MessageResponse`

---

### DELETE `/api/v1/classes/{id}`
Delete a class.

**Path Params:** `id` (int64)

**Response:** `MessageResponse`

---

### GET `/api/v1/classes/{id}/members`
Retrieve the list of members in a class.

**Path Params:** `id` (int64)

**Response:** `ClassMemberListResponse`

---

### POST `/api/v1/classes/{id}/members`
Add a student to a class.

**Path Params:** `id` (int64)

**Request Body:** `AddClassMemberRequest`

**Response:** `AddedClassMemberResponse`

---

### DELETE `/api/v1/classes/{id}/members/{memberId}`
Remove a member from a class.

**Path Params:** `id` (int64), `memberId` (int64)

**Response:** `MessageResponse`

---

## 5. Assignment

### GET `/api/v1/classes/{classId}/assignments`
Retrieve a paginated list of assignments for a class with optional status filtering.

**Path Params:** `classId` (int64)

**Query Params:**

| Name | Type | Description |
|------|------|-------------|
| `status` | string | Filter by status |
| `page` | integer | Page number |
| `limit` | integer | Records per page |

**Response:** `AssignmentListResponse`

---

### POST `/api/v1/classes/{classId}/assignments`
Create a new assignment in a class.

**Path Params:** `classId` (int64)

**Request Body:** `CreateAssignmentRequest`

**Response:** `CreatedAssignmentResponse`

---

### GET `/api/v1/assignments/{assignmentId}`
Retrieve assignment details.

**Path Params:** `assignmentId` (int64)

**Response:** `AssignmentDetailResponse`

---

### PUT `/api/v1/assignments/{assignmentId}`
Update assignment information.

**Path Params:** `assignmentId` (int64)

**Request Body:** `UpdateAssignmentRequest`

**Response:** `MessageResponse`

---

### DELETE `/api/v1/assignments/{assignmentId}`
Delete an assignment.

**Path Params:** `assignmentId` (int64)

**Response:** `MessageResponse`

---

### PATCH `/api/v1/assignments/{assignmentId}/status`
Update the status of an assignment (open/closed/etc.).

**Path Params:** `assignmentId` (int64)

**Request Body:** `UpdateAssignmentStatusRequest`

**Response:** `MessageResponse`

---

## 6. Module

### GET `/api/v1/assignments/{assignmentId}/modules`
Retrieve the list of modules for an assignment.

**Path Params:** `assignmentId` (int64)

**Response:** `ModuleListResponse`

---

### POST `/api/v1/assignments/{assignmentId}/modules`
Create a new module within an assignment.

**Path Params:** `assignmentId` (int64)

**Request Body:** `CreateModuleRequest`

**Response:** `CreatedModuleResponse`

---

### GET `/api/v1/modules/{moduleId}`
Retrieve module details.

**Path Params:** `moduleId` (int64)

**Response:** `ModuleDetailResponse`

---

### PUT `/api/v1/modules/{moduleId}`
Update module information.

**Path Params:** `moduleId` (int64)

**Request Body:** `UpdateModuleRequest`

**Response:** `ModuleMessageResponse`

---

### DELETE `/api/v1/modules/{moduleId}`
Delete a module.

**Path Params:** `moduleId` (int64)

**Response:** `ModuleMessageResponse`

---

### POST `/api/v1/modules/{moduleId}/audio`
Upload an audio file for a module (multipart/form-data).

**Path Params:** `moduleId` (int64)

**Request Body:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | binary | Audio file to upload |

**Response:** `AudioUploadResponse`

---

## 7. Question

### GET `/api/v1/modules/{moduleId}/questions`
Retrieve the list of questions for a module.

**Path Params:** `moduleId` (int64)

**Response:** `QuestionListResponse`

---

### POST `/api/v1/modules/{moduleId}/questions`
Create a new question within a module.

**Path Params:** `moduleId` (int64)

**Request Body:** `CreateQuestionRequest`

**Response:** `CreatedQuestionResponse`

---

### GET `/api/v1/questions/{questionId}`
Retrieve question details.

**Path Params:** `questionId` (int64)

**Response:** `QuestionResponse`

---

### PUT `/api/v1/questions/{questionId}`
Update a question.

**Path Params:** `questionId` (int64)

**Request Body:** `UpdateQuestionRequest`

**Response:** `QuestionMessageResponse`

---

### DELETE `/api/v1/questions/{questionId}`
Delete a question.

**Path Params:** `questionId` (int64)

**Response:** `QuestionMessageResponse`

---

## 8. Submission

### GET `/api/v1/submissions`
Retrieve a paginated list of submissions with optional multi-criteria filtering.

**Query Params:**

| Name | Type | Description |
|------|------|-------------|
| `assignmentId` | int64 | Filter by assignment |
| `studentId` | int64 | Filter by student |
| `status` | string | Filter by status |
| `page` | integer | Page number |
| `limit` | integer | Records per page |

**Response:** `SubmissionListResponse`

---

### POST `/api/v1/assignments/{assignmentId}/submissions`
Start (create) a new submission attempt for an assignment.

**Path Params:** `assignmentId` (int64)

**Response:** `StartSubmissionResponse`

---

### GET `/api/v1/submissions/{id}`
Retrieve submission details.

**Path Params:** `id` (int64)

**Response:** `SubmissionDetailResponse`

---

### POST `/api/v1/submissions/{id}/submit`
Submit the assignment (finalize with submitted status).

**Path Params:** `id` (int64)

**Response:** `SubmitResponse`

---

## 9. Submission Module

### GET `/api/v1/submission-modules/{id}`
Retrieve details of a submission module, including questions and answers.

**Path Params:** `id` (int64)

**Response:** `SubmissionModuleDetailResponse`

---

### POST `/api/v1/submission-modules/{id}/submit`
Submit answers for a submission module.

**Path Params:** `id` (int64)

**Request Body:** `SubmitModuleRequest`

**Response:** `SubmitModuleResponse`

---

### POST `/api/v1/submission-modules/{id}/document-upload-url`
Get a pre-signed URL to upload a document file for a submission module.

**Path Params:** `id` (int64)

**Request Body:** `UploadUrlRequest`

**Response:** `UploadUrlResponse`

---

### POST `/api/v1/submission-modules/{id}/audio-upload-url`
Get a pre-signed URL to upload an audio file for a submission module.

**Path Params:** `id` (int64)

**Request Body:** `UploadUrlRequest`

**Response:** `UploadUrlResponse`

---

## 10. Grading

### GET `/api/v1/gradings`
Retrieve a paginated list of grading records with optional multi-criteria filtering.

**Query Params:**

| Name | Type | Description |
|------|------|-------------|
| `classId` | int64 | Filter by class |
| `studentId` | int64 | Filter by student |
| `status` | string | Filter by grading status |
| `page` | integer | Page number |
| `limit` | integer | Records per page |

**Response:** `GradingListResponse`

---

### GET `/api/v1/gradings/{id}`
Retrieve grading record details.

**Path Params:** `id` (int64)

**Response:** `GradingDetailResponse`

---

### PUT `/api/v1/gradings/{id}`
Update the final score and final feedback from the teacher.

**Path Params:** `id` (int64)

**Request Body:** `UpdateFinalGradeRequest`

**Response:** `GradingMessageResponse`

---

### GET `/api/v1/gradings/{id}/change-logs`
Retrieve the score change history for a grading record.

**Path Params:** `id` (int64)

**Response:** `GradingChangeLogListResponse`

---

### GET `/api/v1/submission-modules/{id}/grading`
Retrieve the grading information for a submission module.

**Path Params:** `id` (int64)

**Response:** `SubmissionModuleGradingResponse`

---

### POST `/api/v1/submission-modules/{id}/grading/ai-analyze`
Trigger AI to automatically analyze and grade a submission module.

**Path Params:** `id` (int64)

**Response:** `GradingMessageResponse`

---

### GET `/api/v1/answers/{id}/annotations`
Retrieve the list of annotations (error highlights) for an answer.

**Path Params:** `id` (int64)

**Response:** `AnswerAnnotationListResponse`

---

### POST `/api/v1/answers/{id}/annotations`
Create a new annotation for an answer.

**Path Params:** `id` (int64)

**Request Body:** `CreateAnswerAnnotationRequest`

**Response:** `CreatedAnswerAnnotationResponse`

---

## 11. Annotations

### PATCH `/api/v1/annotations/{id}/review`
Update the review status of an annotation.

**Path Params:** `id` (int64)

**Request Body:** `ReviewAnswerAnnotationRequest`

**Response:** `GradingMessageResponse`

---

### DELETE `/api/v1/annotations/{id}`
Delete an annotation.

**Path Params:** `id` (int64)

**Response:** `GradingMessageResponse`

---

## 12. Student Evaluation

### GET `/api/v1/students/{id}/evaluations`
Retrieve a paginated list of evaluations for a student, optionally filtered by class and creation date range.

**Path Params:** `id` (int64)

**Query Params:**

| Name | Type | Description |
|------|------|-------------|
| `classId` | int64 | Filter by class |
| `fromDate` | date (`yyyy-MM-dd`) | Include evaluations created on or after this date in `Asia/Ho_Chi_Minh` time. |
| `toDate` | date (`yyyy-MM-dd`) | Include evaluations created on or before this date in `Asia/Ho_Chi_Minh` time. |
| `page` | integer | Page number |
| `limit` | integer | Records per page |

Both date boundaries are inclusive. Invalid dates or `fromDate` after `toDate` return HTTP 400 with `Khoảng thời gian không hợp lệ.`.

**Response:** `StudentEvaluationListResponse`

---

### POST `/api/v1/students/{id}/evaluations`
Create a new evaluation for a student.

**Path Params:** `id` (int64)

**Request Body:** `CreateStudentEvaluationRequest`

**Response:** `MessageResponse`

---

### GET `/api/v1/evaluations/{id}`
Retrieve evaluation details.

**Path Params:** `id` (int64)

**Response:** `StudentEvaluationResponse`

---

### PUT `/api/v1/evaluations/{id}`
Update evaluation content.

**Path Params:** `id` (int64)

**Request Body:** `UpdateStudentEvaluationRequest`

**Response:** `MessageResponse`

---

### DELETE `/api/v1/evaluations/{id}`
Delete an evaluation.

**Path Params:** `id` (int64)

**Response:** `MessageResponse`

---

---

## 13. DTO Objects

### Request DTOs

---

#### `LoginRequest`
| Field | Type | Description |
|-------|------|-------------|
| `email` | string | Login email |
| `password` | string | Password |

---

#### `RefreshRequest`
| Field | Type | Description |
|-------|------|-------------|
| `refreshToken` | string | Current refresh token |

---

#### `LogoutRequest`
| Field | Type | Description |
|-------|------|-------------|
| `refreshToken` | string | Refresh token to invalidate |

---

#### `UpdateOwnProfileRequest`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fullName` | string\|null | No | Full name |
| `phone` | string\|null | No | Phone number |
| `avatarUrl` | string\|null | No | Avatar image URL |

---

#### `ChangePasswordRequest`
| Field | Type | Description |
|-------|------|-------------|
| `currentPassword` | string | Current password |
| `newPassword` | string | New password |

---

#### `CreateUserRequest`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fullName` | string | Yes | Full name |
| `email` | string | Yes | Email address |
| `password` | string | Yes | Password |
| `role` | string | Yes | Role (STUDENT, TEACHER, ADMIN…) |
| `specialization` | string\|null | No | Specialization (for teachers) |
| `studentCode` | string\|null | No | Student code |
| `dateOfBirth` | string\|null (date) | No | Date of birth `YYYY-MM-DD` |
| `parentPhone` | string\|null | No | Parent's phone number |

---

#### `UpdateUserRequest`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fullName` | string\|null | No | Full name |
| `phone` | string\|null | No | Phone number |
| `specialization` | string\|null | No | Specialization |
| `studentCode` | string\|null | No | Student code |
| `dateOfBirth` | string\|null (date) | No | Date of birth `YYYY-MM-DD` |
| `parentPhone` | string\|null | No | Parent's phone number |

---

#### `UpdateUserStatusRequest`
| Field | Type | Description |
|-------|------|-------------|
| `status` | string | New status (ACTIVE / INACTIVE…) |

---

#### `CreateClassRequest`
| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Class name |
| `level` | string | Level |
| `description` | string | Description |
| `startDate` | string (date) | Start date `YYYY-MM-DD` |
| `endDate` | string (date) | End date `YYYY-MM-DD` |
| `teacherId` | int64 | ID of the assigned teacher |

---

#### `UpdateClassRequest`
| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Class name |
| `level` | string | Level |
| `description` | string | Description |
| `endDate` | string (date) | End date `YYYY-MM-DD` |
| `status` | string | Class status |
| `teacherId` | int64 | Teacher ID |

---

#### `AddClassMemberRequest`
| Field | Type | Description |
|-------|------|-------------|
| `studentId` | int64 | ID of the student to add |

---

#### `CreateAssignmentRequest`
| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Assignment title |
| `description` | string | Description |
| `openAt` | string (date-time) | Opening time `ISO 8601` |
| `closeAt` | string (date-time) | Closing time `ISO 8601` |
| `maxSubmissions` | integer (int32) | Maximum number of submission attempts |

---

#### `UpdateAssignmentRequest`
| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Assignment title |
| `description` | string | Description |
| `openAt` | string (date-time) | Opening time |
| `closeAt` | string (date-time) | Closing time |
| `maxSubmissions` | integer (int32) | Maximum submission attempts |

---

#### `UpdateAssignmentStatusRequest`
| Field | Type | Description |
|-------|------|-------------|
| `status` | string | New assignment status |

---

#### `CreateModuleRequest`
| Field | Type | Description |
|-------|------|-------------|
| `skill` | string | Skill (READING, WRITING, LISTENING, SPEAKING…) |
| `taskType` | string | Task type |
| `orderIndex` | integer (int32) | Display order |
| `instructions` | string | Instructions for students |
| `aiInstruction` | string | Instructions for AI grading |
| `maxScore` | number | Maximum score |

---

#### `UpdateModuleRequest`
| Field | Type | Description |
|-------|------|-------------|
| `instructions` | string | Instructions for students |
| `aiInstruction` | string | Instructions for AI grading |
| `maxScore` | number | Maximum score |
| `orderIndex` | integer (int32) | Display order |

---

#### `CreateQuestionRequest`
| Field | Type | Description |
|-------|------|-------------|
| `content` | string | Question content |
| `questionType` | string | Question type (`MULTIPLE_CHOICE`, `SHORT_ANSWER`…) |
| `correctAnswer` | `MultipleChoiceCorrectAnswer` \| `ShortAnswerCorrectAnswer` | Correct answer (polymorphic) |
| `score` | number | Question score |
| `orderIndex` | integer (int32) | Display order |

---

#### `UpdateQuestionRequest`
| Field | Type | Description |
|-------|------|-------------|
| `content` | string | Question content |
| `correctAnswer` | `MultipleChoiceCorrectAnswer` \| `ShortAnswerCorrectAnswer` | Correct answer (polymorphic) |
| `score` | number | Score |
| `orderIndex` | integer (int32) | Display order |

---

#### `SubmitModuleRequest`
| Field | Type | Description |
|-------|------|-------------|
| `answers` | `AnswerPayload[]` | List of answers |

---

#### `AnswerPayload`
| Field | Type | Description |
|-------|------|-------------|
| `questionId` | int64 | Question ID |
| `content` | `MultipleChoiceAnswerContent` \| `ShortAnswerAnswerContent` | Answer content (polymorphic) |

> `MultipleChoiceAnswerContent` and `ShortAnswerAnswerContent` are polymorphic subtypes; their structure depends on the question type.

---

#### `UploadUrlRequest`
| Field | Type | Description |
|-------|------|-------------|
| `mimeType` | string | File MIME type (e.g. `audio/mpeg`, `application/pdf`) |

---

#### `UpdateFinalGradeRequest`
| Field | Type | Description |
|-------|------|-------------|
| `finalScore` | number | Final score |
| `finalFeedback` | string | Teacher's final feedback |
| `note` | string | Internal note (saved in change log) |

---

#### `CreateAnswerAnnotationRequest`
| Field | Type | Description |
|-------|------|-------------|
| `startOffset` | integer (int32) | Start position within the text |
| `endOffset` | integer (int32) | End position within the text |
| `errorType` | string | Error type (grammar, spelling…) |
| `comment` | string | Teacher's comment |
| `suggestedFix` | string | Suggested correction |

---

#### `ReviewAnswerAnnotationRequest`
| Field | Type | Description |
|-------|------|-------------|
| `reviewStatus` | string | Review status (ACCEPTED / REJECTED…) |

---

#### `CreateStudentEvaluationRequest`
| Field | Type | Description |
|-------|------|-------------|
| `classId` | int64 | Class ID |
| `content` | string | Evaluation content |

---

#### `UpdateStudentEvaluationRequest`
| Field | Type | Description |
|-------|------|-------------|
| `content` | string | Updated evaluation content |

---

### Response DTOs

---

#### `MessageResponse`
| Field | Type | Description |
|-------|------|-------------|
| `message` | string | Result message |

---

#### `AuthResponse`
| Field | Type | Description |
|-------|------|-------------|
| `message` | string | Message |
| `accessToken` | string | JWT access token |
| `refreshToken` | string | JWT refresh token |
| `user` | `AuthUserResponse` | User information |

---

#### `AuthUserResponse`
| Field | Type | Description |
|-------|------|-------------|
| `id` | int64 | User ID |
| `fullName` | string | Full name |
| `email` | string | Email |
| `role` | string | Role |

---

#### `RefreshResponse`
| Field | Type | Description |
|-------|------|-------------|
| `message` | string | Message |
| `accessToken` | string | New access token |

---

#### `LogoutResponse`
| Field | Type | Description |
|-------|------|-------------|
| `message` | string | Message |

---

#### `UserResponse`
| Field | Type | Description |
|-------|------|-------------|
| `id` | int64 | ID |
| `fullName` | string | Full name |
| `email` | string | Email |
| `role` | string | Role |
| `status` | string | Account status |
| `phone` | string | Phone number |
| `avatarUrl` | string | Avatar URL |
| `specialization` | string | Specialization |
| `studentCode` | string | Student code |
| `dateOfBirth` | string (date) | Date of birth |
| `parentPhone` | string | Parent's phone number |

---

#### `AdminUserSummary`
| Field | Type | Description |
|-------|------|-------------|
| `id` | int64 | ID |
| `fullName` | string | Full name |
| `email` | string | Email |
| `role` | string | Role |
| `status` | string | Account status |

---

#### `AdminUserListResponse`
| Field | Type | Description |
|-------|------|-------------|
| `data` | `AdminUserSummary[]` | List of users |
| `pagination` | `PaginationResponse` | Pagination info |

---

#### `CreatedUser`
| Field | Type | Description |
|-------|------|-------------|
| `id` | int64 | Newly created user ID |
| `email` | string | Email |
| `role` | string | Role |

---

#### `CreatedUserResponse`
| Field | Type | Description |
|-------|------|-------------|
| `message` | string | Message |
| `user` | `CreatedUser` | Newly created user info |

---

#### `ClassSummaryResponse`
| Field | Type | Description |
|-------|------|-------------|
| `id` | int64 | Class ID |
| `name` | string | Class name |
| `status` | string | Status |
| `teacherId` | int64 | Teacher ID |

---

#### `ClassListResponse`
| Field | Type | Description |
|-------|------|-------------|
| `data` | `ClassSummaryResponse[]` | List of classes |
| `pagination` | `PaginationResponse` | Pagination info |

---

#### `ClassDetailResponse`
| Field | Type | Description |
|-------|------|-------------|
| `id` | int64 | Class ID |
| `name` | string | Class name |
| `level` | string | Level |
| `description` | string | Description |
| `startDate` | string (date) | Start date |
| `endDate` | string (date) | End date |
| `status` | string | Status |
| `teacher` | `TeacherResponse` | Teacher information |
| `memberCount` | int64 | Number of members |

---

#### `TeacherResponse`
| Field | Type | Description |
|-------|------|-------------|
| `id` | int64 | Teacher ID |
| `fullName` | string | Full name |

---

#### `ClassMemberResponse`
| Field | Type | Description |
|-------|------|-------------|
| `memberId` | int64 | Member record ID |
| `studentId` | int64 | Student ID |
| `fullName` | string | Student full name |
| `studentCode` | string | Student code |

---

#### `ClassMemberListResponse`
| Field | Type | Description |
|-------|------|-------------|
| `data` | `ClassMemberResponse[]` | List of members |

---

#### `CreatedClassResponse`
| Field | Type | Description |
|-------|------|-------------|
| `message` | string | Message |
| `id` | int64 | Newly created class ID |

---

#### `AddedClassMemberResponse`
| Field | Type | Description |
|-------|------|-------------|
| `message` | string | Message |
| `memberId` | int64 | Newly added member record ID |

---

#### `AssignmentSummaryResponse`
| Field | Type | Description |
|-------|------|-------------|
| `id` | int64 | Assignment ID |
| `title` | string | Title |
| `status` | string | Status |
| `closeAt` | string (date-time) | Closing time |

---

#### `AssignmentListResponse`
| Field | Type | Description |
|-------|------|-------------|
| `data` | `AssignmentSummaryResponse[]` | List of assignments |
| `pagination` | `PaginationResponse` | Pagination info |

---

#### `AssignmentModuleSummaryResponse`
| Field | Type | Description |
|-------|------|-------------|
| `id` | int64 | Module ID |
| `skill` | string | Skill |

---

#### `AssignmentDetailResponse`
| Field | Type | Description |
|-------|------|-------------|
| `id` | int64 | Assignment ID |
| `title` | string | Title |
| `status` | string | Status |
| `modules` | `AssignmentModuleSummaryResponse[]` | List of modules |

---

#### `CreatedAssignmentResponse`
| Field | Type | Description |
|-------|------|-------------|
| `message` | string | Message |
| `id` | int64 | Newly created assignment ID |

---

#### `ModuleSummaryResponse`
| Field | Type | Description |
|-------|------|-------------|
| `id` | int64 | Submission module ID |
| `moduleId` | int64 | Original module ID |
| `skill` | string | Skill |
| `taskType` | string | Task type |
| `status` | string | Status |
| `grading` | `GradingSummaryResponse` | Grading summary |

---

#### `ModuleDetailResponse`
| Field | Type | Description |
|-------|------|-------------|
| `id` | int64 | Submission module ID |
| `moduleId` | int64 | Original module ID |
| `skill` | string | Skill |
| `taskType` | string | Task type |
| `status` | string | Status |
| `grading` | `GradingDetailResponse` | Grading details |

---

#### `ModuleListResponse`
| Field | Type | Description |
|-------|------|-------------|
| `data` | `ModuleSummaryResponse[]` | List of modules |

---

#### `ModuleResponse`
| Field | Type | Description |
|-------|------|-------------|
| `id` | int64 | Submission module ID |
| `moduleId` | int64 | Original module ID |
| `skill` | string | Skill |
| `status` | string | Status |

---

#### `CreatedModuleResponse`
| Field | Type | Description |
|-------|------|-------------|
| `message` | string | Message |
| `id` | int64 | Newly created module ID |

---

#### `ModuleMessageResponse`
| Field | Type | Description |
|-------|------|-------------|
| `message` | string | Message |

---

#### `AudioUploadResponse`
| Field | Type | Description |
|-------|------|-------------|
| `message` | string | Message |
| `sourceAudioStorageKey` | string | Audio file storage key |
| `sourceAudioUploadStatus` | string | Upload status |

---

#### `QuestionOption`
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer (int32) | Option ID |
| `content` | string | Content |
| `isCorrect` | boolean | Whether this is the correct answer |

---

#### `QuestionResponse`
| Field | Type | Description |
|-------|------|-------------|
| `id` | int64 | Question ID |
| `content` | string | Question content |
| `questionType` | string | Question type |
| `score` | number | Score |
| `orderIndex` | integer (int32) | Display order |
| `correctAnswer` | `JsonNode` | Correct answer (dynamic JSON) |

---

#### `QuestionListResponse`
| Field | Type | Description |
|-------|------|-------------|
| `data` | `QuestionResponse[]` | List of questions |

---

#### `QuestionMessageResponse`
| Field | Type | Description |
|-------|------|-------------|
| `message` | string | Message |

---

#### `CreatedQuestionResponse`
| Field | Type | Description |
|-------|------|-------------|
| `message` | string | Message |
| `id` | int64 | Newly created question ID |

---

#### `StartSubmissionResponse`
| Field | Type | Description |
|-------|------|-------------|
| `id` | int64 | Newly created submission ID |
| `assignmentId` | int64 | Assignment ID |
| `attemptNumber` | integer (int32) | Attempt number |
| `status` | string | Status |
| `createdAt` | string (date-time) | Creation time |
| `modules` | `ModuleResponse[]` | List of modules in the submission |

---

#### `SubmitResponse`
| Field | Type | Description |
|-------|------|-------------|
| `message` | string | Message |
| `status` | string | New status |
| `submittedAt` | string (date-time) | Submission time |

---

#### `SubmissionListItemResponse`
| Field | Type | Description |
|-------|------|-------------|
| `id` | int64 | Submission ID |
| `studentId` | int64 | Student ID |
| `attemptNumber` | integer (int32) | Attempt number |
| `status` | string | Status |
| `submittedAt` | string (date-time) | Submission time |
| `modules` | `ModuleSummaryResponse[]` | List of modules |

---

#### `SubmissionListResponse`
| Field | Type | Description |
|-------|------|-------------|
| `data` | `SubmissionListItemResponse[]` | List of submissions |
| `pagination` | `PaginationResponse` | Pagination info |

---

#### `SubmissionDetailResponse`
| Field | Type | Description |
|-------|------|-------------|
| `id` | int64 | Submission ID |
| `assignmentId` | int64 | Assignment ID |
| `studentId` | int64 | Student ID |
| `attemptNumber` | integer (int32) | Attempt number |
| `status` | string | Status |
| `submittedAt` | string (date-time) | Submission time |
| `createdAt` | string (date-time) | Creation time |
| `modules` | `ModuleDetailResponse[]` | Module details |

---

#### `AnswerResponse`
| Field | Type | Description |
|-------|------|-------------|
| `id` | int64 | Answer ID |
| `questionId` | int64 | Question ID |
| `content` | `JsonNode` | Answer content (dynamic JSON) |
| `docStorageKey` | string | Document storage key |
| `docMimeType` | string | Document MIME type |
| `docUploadStatus` | string | Document upload status |
| `audioStorageKey` | string | Audio storage key |
| `audioMimeType` | string | Audio MIME type |
| `audioUploadStatus` | string | Audio upload status |

---

#### `AnswerDetailResponse`
Same structure as `AnswerResponse`.

---

#### `SubmitModuleResponse`
| Field | Type | Description |
|-------|------|-------------|
| `message` | string | Message |
| `submissionModuleId` | int64 | Submission module ID |
| `status` | string | Status |
| `answers` | `AnswerResponse[]` | List of saved answers |

---

#### `SubmissionModuleDetailResponse`
| Field | Type | Description |
|-------|------|-------------|
| `id` | int64 | Submission module ID |
| `moduleId` | int64 | Original module ID |
| `skill` | string | Skill |
| `taskType` | string | Task type |
| `status` | string | Status |
| `grading` | `GradingDetailResponse` | Grading details |
| `questions` | `QuestionResponse[]` | List of questions |
| `answers` | `AnswerDetailResponse[]` | List of answers |

---

#### `SubmissionModuleGradingResponse`
| Field | Type | Description |
|-------|------|-------------|
| `id` | int64 | Grading ID |
| `method` | string | Grading method (AI / MANUAL) |
| `status` | string | Grading status |
| `finalScore` | number | Final score |

---

#### `UploadUrlResponse`
| Field | Type | Description |
|-------|------|-------------|
| `uploadUrl` | string | Pre-signed upload URL |
| `storageKey` | string | Cloud storage key |
| `expiresAt` | string (date-time) | URL expiration time |

---

#### `GradingSummaryResponse`
| Field | Type | Description |
|-------|------|-------------|
| `finalScore` | number | Final score |
| `maxScoreSnapshot` | number | Maximum score at time of grading |
| `status` | string | Grading status |

---

#### `GradingDetailResponse`
| Field | Type | Description |
|-------|------|-------------|
| `id` | int64 | Grading ID |
| `method` | string | Grading method (AI / MANUAL) |
| `status` | string | Grading status |
| `finalScore` | number | Final score |
| `maxScoreSnapshot` | number | Maximum score |
| `aiFeedback` | string | AI-generated feedback |
| `finalFeedback` | string | Teacher's final feedback |

---

#### `GradingMessageResponse`
| Field | Type | Description |
|-------|------|-------------|
| `message` | string | Message |

---

#### `GradingChangeLogResponse`
| Field | Type | Description |
|-------|------|-------------|
| `changedBy` | string | Who made the change |
| `oldScore` | number | Previous score |
| `newScore` | number | New score |
| `note` | string | Note |
| `changedAt` | string (date-time) | Time of change |

---

#### `GradingChangeLogListResponse`
| Field | Type | Description |
|-------|------|-------------|
| `data` | `GradingChangeLogResponse[]` | Score change history |

---

#### `GradingListResponse`
| Field | Type | Description |
|-------|------|-------------|
| `data` | `GradingSummaryResponse[]` | List of grading records |
| `pagination` | `PaginationResponse` | Pagination info |

---

#### `AnswerAnnotationResponse`
| Field | Type | Description |
|-------|------|-------------|
| `id` | int64 | Annotation ID |
| `source` | string | Source (AI / MANUAL) |
| `startOffset` | integer (int32) | Start position in text |
| `endOffset` | integer (int32) | End position in text |
| `errorType` | string | Error type |
| `comment` | string | Comment |
| `suggestedFix` | string | Suggested correction |
| `reviewStatus` | string | Review status |

---

#### `AnswerAnnotationListResponse`
| Field | Type | Description |
|-------|------|-------------|
| `data` | `AnswerAnnotationResponse[]` | List of annotations |

---

#### `CreatedAnswerAnnotationResponse`
| Field | Type | Description |
|-------|------|-------------|
| `message` | string | Message |
| `id` | int64 | Newly created annotation ID |

---

#### `StudentEvaluationResponse`
| Field | Type | Description |
|-------|------|-------------|
| `id` | int64 | Evaluation ID |
| `content` | string | Evaluation content |

---

#### `Item` _(used in StudentEvaluationListResponse)_
| Field | Type | Description |
|-------|------|-------------|
| `id` | int64 | Evaluation ID |
| `classId` | int64 | Class ID |
| `teacherName` | string | Name of the teacher who wrote the evaluation |
| `content` | string | Evaluation content |
| `createdAt` | string (date-time) | Creation time |

---

#### `StudentEvaluationListResponse`
| Field | Type | Description |
|-------|------|-------------|
| `data` | `Item[]` | List of evaluations |
| `pagination` | `PaginationResponse` | Pagination info |

---

#### `PaginationResponse`
| Field | Type | Description |
|-------|------|-------------|
| `page` | integer (int32) | Current page |
| `limit` | integer (int32) | Records per page |
| `total` | int64 | Total number of records |

---

*Documentation auto-generated from OpenAPI spec — EnglishHub API v1*
