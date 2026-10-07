export const ROUTES = {
  AUTH: {
    LOGIN: '/auth/login'
  },
  TEACHER: {
    ASSIGNMENTS: '/teacher/assignments',
    ASSIGNMENT_EDIT: (id) => /teacher/assignments//edit,
    ASSIGNMENT_DETAILS: (id) => /teacher/assignments/
  },
  STUDENT: {
    ASSIGNMENTS: '/student/assignments'
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard'
  }
};
