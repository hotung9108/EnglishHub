import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Roles from './pages/Roles';
import Classes from './pages/Classes';
import AddClass from './pages/AddClass';
import ClassDetails from './pages/ClassDetails';
import Teachers from './pages/Teachers';
import AddTeacher from './pages/AddTeacher';
import Students from './pages/Students';
import AddStudent from './pages/AddStudent';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import TeacherClasses from './pages/TeacherClasses';
import TeacherDetails from './pages/TeacherDetails';
import StudentAssignments from './pages/StudentAssignments';
import StudentClasses from './pages/StudentClasses';
import StudentClassDetails from './pages/StudentClassDetails';
import StudentAssignmentWriting from './pages/StudentAssignmentWriting';
import StudentAssignmentReading from './pages/StudentAssignmentReading';
import StudentAssignmentListening from './pages/StudentAssignmentListening';
import StudentAssignmentSpeaking from './pages/StudentAssignmentSpeaking';
import StudentSubmissionResult from './pages/StudentSubmissionResult';
import StudentAssignmentOverview from './pages/StudentAssignmentOverview';
import StudentDashboard from './pages/StudentDashboard';
import StudentWorkspace from './pages/StudentWorkspace';
import StudentFeedback from './pages/StudentFeedback';
import StudentGrades from './pages/StudentGrades';
import StudentAnalytics from './pages/StudentAnalytics';
import TeacherAssignments from './pages/TeacherAssignments';
import TeacherAssignmentDetails from './pages/TeacherAssignmentDetails';
import TeacherCreateAssignment from './pages/TeacherCreateAssignment';
import TeacherEditAssignment from './pages/TeacherEditAssignment';
import TeacherExamBank from './pages/TeacherExamBank';
import TeacherSubmissionDetails from './pages/TeacherSubmissionDetails';
import TeacherClassProgress from './pages/TeacherClassProgress';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDetails from './pages/StudentDetails';
import AdminReports from './pages/AdminReports';
import AdminSettings from './pages/AdminSettings';
import AdminGradingAuditLogs from './pages/AdminGradingAuditLogs';
import AdminClassArchive from './pages/AdminClassArchive';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import NotFound from './pages/NotFound';
import Forbidden from './pages/Forbidden';

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
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
        <Route path="/reports" element={<Navigate to="/admin/reports" replace />} />
        <Route path="/progress" element={<Navigate to="/teacher/classes" replace />} />

        {/* Teacher Routes */}
        <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
          <Route path="/teacher" element={<MainLayout />}>
            <Route index element={<Navigate to="/teacher/dashboard" replace />} />
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="classes" element={<TeacherClasses />} />
            <Route path="classes/:id" element={<TeacherClassProgress />} />
            <Route path="classes/:id/progress" element={<TeacherClassProgress />} />
            <Route path="assignments" element={<TeacherAssignments />} />
            <Route path="assignments/create" element={<TeacherCreateAssignment />} />
            <Route path="assignments/:id" element={<TeacherAssignmentDetails />} />
            <Route path="assignments/:id/edit" element={<TeacherEditAssignment />} />
            <Route path="assignments/edit/:id" element={<TeacherEditAssignment />} />
            <Route path="assignments/:id/submissions/:studentId" element={<TeacherSubmissionDetails />} />
            <Route path="exam-bank" element={<TeacherExamBank />} />
            <Route path="assignments/templates" element={<Navigate to="/teacher/exam-bank" replace />} />
            <Route path="settings" element={<Settings />} />
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
            <Route path="assignments/reading/:id" element={<StudentAssignmentReading />} />
            <Route path="assignments/listening/:id" element={<StudentAssignmentListening />} />
            <Route path="assignments/speaking/:id" element={<StudentAssignmentSpeaking />} />
            <Route path="workspace" element={<StudentWorkspace />} />
            <Route path="feedback" element={<StudentFeedback />} />
            <Route path="grades" element={<StudentGrades />} />
            <Route path="analytics" element={<StudentAnalytics />} />
            <Route path="status" element={<StudentAssignments />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Global Catch-all 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </LanguageProvider>
  </AuthProvider>
);
}

export default App;
