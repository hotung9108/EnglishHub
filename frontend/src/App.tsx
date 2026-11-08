import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider } from './components/common/ToastContext';
import { DocumentTitleManager } from './components/common/DocumentTitleManager';
import { useAuth } from './hooks/useAuth';

// Auth & Error Pages (Static for instant initial display)
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import Forbidden from './pages/Forbidden';

// Admin Pages (Code-split via React.lazy)
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Accounts = React.lazy(() => import('./pages/Accounts'));
const Classes = React.lazy(() => import('./pages/Classes'));
const AddClass = React.lazy(() => import('./pages/AddClass'));
const ClassDetails = React.lazy(() => import('./pages/ClassDetails'));
const Teachers = React.lazy(() => import('./pages/Teachers'));
const AddTeacher = React.lazy(() => import('./pages/AddTeacher'));
const TeacherDetails = React.lazy(() => import('./pages/TeacherDetails'));
const Students = React.lazy(() => import('./pages/Students'));
const AddStudent = React.lazy(() => import('./pages/AddStudent'));
const StudentDetails = React.lazy(() => import('./pages/StudentDetails'));
const Profile = React.lazy(() => import('./pages/Profile'));
const AdminSettings = React.lazy(() => import('./pages/AdminSettings'));
const AdminReports = React.lazy(() => import('./pages/AdminReports'));
const AdminGradingAuditLogs = React.lazy(() => import('./pages/AdminGradingAuditLogs'));
const AdminClassArchive = React.lazy(() => import('./pages/AdminClassArchive'));
const Roles = React.lazy(() => import('./pages/Roles'));

// Teacher Pages (Code-split via React.lazy)
const TeacherClasses = React.lazy(() => import('./pages/TeacherClasses'));
const TeacherAssignments = React.lazy(() => import('./pages/TeacherAssignments'));
const TeacherAssignmentDetails = React.lazy(() => import('./pages/TeacherAssignmentDetails'));
const TeacherAssignmentGrading = React.lazy(() => import('./pages/TeacherAssignmentGrading'));
const TeacherCreateAssignment = React.lazy(() => import('./pages/TeacherCreateAssignment'));
const TeacherEditAssignment = React.lazy(() => import('./pages/TeacherEditAssignment'));
const TeacherSubmissionDetails = React.lazy(() => import('./pages/TeacherSubmissionDetails'));
const TeacherClassProgress = React.lazy(() => import('./pages/TeacherClassProgress'));
const TeacherDashboard = React.lazy(() => import('./pages/TeacherDashboard'));
const TeacherExamBank = React.lazy(() => import('./pages/TeacherExamBank'));

// Student Pages (Code-split via React.lazy)
const StudentAssignments = React.lazy(() => import('./pages/StudentAssignments'));
const StudentClasses = React.lazy(() => import('./pages/StudentClasses'));
const StudentClassDetails = React.lazy(() => import('./pages/StudentClassDetails'));
const StudentAssignmentWriting = React.lazy(() => import('./pages/StudentAssignmentWriting'));
const StudentAssignmentReading = React.lazy(() => import('./pages/StudentAssignmentReading'));
const StudentAssignmentListening = React.lazy(() => import('./pages/StudentAssignmentListening'));
const StudentAssignmentSpeaking = React.lazy(() => import('./pages/StudentAssignmentSpeaking'));
const StudentSubmissionResult = React.lazy(() => import('./pages/StudentSubmissionResult'));
const StudentAssignmentOverview = React.lazy(() => import('./pages/StudentAssignmentOverview'));
const StudentDashboard = React.lazy(() => import('./pages/StudentDashboard'));
const StudentFeedback = React.lazy(() => import('./pages/StudentFeedback'));
const StudentGrades = React.lazy(() => import('./pages/StudentGrades'));
const StudentAnalytics = React.lazy(() => import('./pages/StudentAnalytics'));

const PageLoadingFallback: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <div className="eh-skeleton" style={{ width: 48, height: 48, borderRadius: '50%' }} />
  </div>
);

function ReportsRedirect() {
  const { user } = useAuth();
  if (user?.role === 'teacher') {
    return <Navigate to="/teacher/classes" replace />;
  }
  if (user?.role === 'student') {
    return <Navigate to="/student/grades" replace />;
  }
  return <Navigate to="/admin/reports" replace />;
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ToastProvider>
          <DocumentTitleManager />
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Error & Fallback Routes */}
              <Route path="/404" element={<NotFound />} />
              <Route path="/not-found" element={<NotFound />} />
              <Route path="/403" element={<Forbidden />} />
              <Route path="/unauthorized" element={<Forbidden />} />

              {/* Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<MainLayout />}>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="accounts" element={<Accounts />} />
                  <Route path="accounts/profile" element={<Profile />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="roles" element={<Roles />} />
                  <Route path="classes" element={<Classes />} />
                  <Route path="classes/create" element={<AddClass />} />
                  <Route path="classes/archive" element={<AdminClassArchive />} />
                  <Route path="classes/:id" element={<ClassDetails />} />
                  <Route path="teachers" element={<Teachers />} />
                  <Route path="teachers/create" element={<AddTeacher />} />
                  <Route path="teachers/:id" element={<TeacherDetails />} />
                  <Route path="students" element={<Students />} />
                  <Route path="students/create" element={<AddStudent />} />
                  <Route path="students/:id" element={<StudentDetails />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="audit/gradings" element={<AdminGradingAuditLogs />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
              </Route>

              {/* Global Redirects */}
              <Route path="/reports" element={<ReportsRedirect />} />
              <Route path="/progress" element={<Navigate to="/teacher/progress" replace />} />

              {/* Teacher Routes */}
              <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
                <Route path="/teacher" element={<MainLayout />}>
                  <Route index element={<Navigate to="/teacher/dashboard" replace />} />
                  <Route path="dashboard" element={<TeacherDashboard />} />
                  <Route path="classes" element={<TeacherClasses />} />
                  <Route path="classes/:id" element={<TeacherClassProgress />} />
                  <Route path="classes/:id/progress" element={<TeacherClassProgress />} />
                  <Route path="progress" element={<TeacherClassProgress />} />
                  <Route path="assignments" element={<TeacherAssignments />} />
                  <Route path="assignments/create" element={<TeacherCreateAssignment />} />
                  <Route path="assignments/:id" element={<TeacherAssignmentDetails />} />
                  <Route path="assignments/:id/submissions" element={<TeacherAssignmentGrading />} />
                  <Route path="assignments/:id/grading" element={<TeacherAssignmentGrading />} />
                  <Route path="assignments/:id/edit" element={<TeacherEditAssignment />} />
                  <Route path="assignments/edit/:id" element={<TeacherEditAssignment />} />
                  <Route path="assignments/:id/submissions/:studentId" element={<TeacherSubmissionDetails />} />
                  <Route path="exam-bank" element={<TeacherExamBank />} />
                  <Route path="assignments/templates" element={<Navigate to="/teacher/assignments" replace />} />
                  <Route path="settings" element={<Navigate to="/teacher/profile" replace />} />
                  <Route path="profile" element={<Profile />} />
                </Route>
              </Route>

              {/* Student Routes */}
              <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                <Route path="/student" element={<MainLayout />}>
                  <Route index element={<Navigate to="/student/dashboard" replace />} />
                  <Route path="dashboard" element={<StudentDashboard />} />
                  <Route path="classes" element={<StudentClasses />} />
                  <Route path="classes/:id" element={<StudentClassDetails />} />
                  <Route path="assignments" element={<StudentAssignments />} />
                  <Route path="assignments/:id/overview" element={<StudentAssignmentOverview />} />
                  <Route path="assignments/:id/result" element={<StudentSubmissionResult />} />
                  <Route path="submissions/:id" element={<StudentSubmissionResult />} />
                  <Route path="assignments/:id" element={<StudentAssignmentWriting />} />
                  <Route path="assignments/writing/:id" element={<StudentAssignmentWriting />} />
                  <Route path="assignments/reading/:id" element={<StudentAssignmentReading />} />
                  <Route path="assignments/listening/:id" element={<StudentAssignmentListening />} />
                  <Route path="assignments/speaking/:id" element={<StudentAssignmentSpeaking />} />
                  <Route path="workspace" element={<Navigate to="/student/assignments" replace />} />
                  <Route path="feedback" element={<StudentFeedback />} />
                  <Route path="grades" element={<StudentGrades />} />
                  <Route path="analytics" element={<StudentAnalytics />} />
                  <Route path="status" element={<StudentAssignments />} />
                  <Route path="settings" element={<Navigate to="/student/profile" replace />} />
                  <Route path="profile" element={<Profile />} />
                </Route>
              </Route>

              {/* Global Catch-all 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
