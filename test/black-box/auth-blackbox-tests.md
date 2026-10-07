# Black-Box Test Cases - EnglishHub

## Test Case ID: BB-001
**Title**: User Authentication - Valid Login
**Module**: Authentication
**Priority**: High

### Preconditions
- User exists in system with valid credentials
- Backend and Frontend services running

### Test Steps
1. Navigate to login page
2. Enter valid username/email
3. Enter valid password
4. Click Login

### Expected Results
- User is successfully authenticated
- Redirected to appropriate dashboard based on role (Admin/Teacher/Student)
- Session/token is established

### Status
- [ ] Not Started
- [ ] Pass
- [ ] Fail
