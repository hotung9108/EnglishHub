import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
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
import TeacherClasses from './pages/TeacherClasses';
import TeacherDetails from './pages/TeacherDetails';
import StudentAssignments from './pages/StudentAssignments';
import TeacherAssignments from './pages/TeacherAssignments';
import TeacherAssignmentDetails from './pages/TeacherAssignmentDetails';
import TeacherCreateAssignment from './pages/TeacherCreateAssignment';
import TeacherSubmissionDetails from './pages/TeacherSubmissionDetails';
import TeacherClassProgress from './pages/TeacherClassProgress';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<MainLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="accounts/profile" element={<Profile />} />
            <Route path="roles" element={<Roles />} />
            <Route path="classes" element={<Classes />} />
            <Route path="classes/create" element={<AddClass />} />
            <Route path="classes/:id" element={<ClassDetails />} />
            <Route path="teachers" element={<Teachers />} />
            <Route path="teachers/create" element={<AddTeacher />} />
            <Route path="teachers/:id" element={<TeacherDetails />} />
            <Route path="students" element={<Students />} />
            <Route path="students/create" element={<AddStudent />} />
            <Route path="reports" element={<Dashboard />} />
            <Route path="settings" element={<Dashboard />} />
          </Route>
        </Route>

        {/* Teacher Routes */}
        <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
          <Route path="/teacher" element={<MainLayout />}>
            <Route index element={<Navigate to="/teacher/classes" replace />} />
            <Route path="classes" element={<TeacherClasses />} />
            <Route path="classes/:id/progress" element={<TeacherClassProgress />} />
            <Route path="assignments" element={<TeacherAssignments />} />
            <Route path="assignments/create" element={<TeacherCreateAssignment />} />
            <Route path="assignments/:id" element={<TeacherAssignmentDetails />} />
            <Route path="assignments/:id/submissions/:studentId" element={<TeacherSubmissionDetails />} />
          </Route>
        </Route>

        {/* Student Routes */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/student" element={<MainLayout />}>
            <Route index element={<Navigate to="/student/dashboard" replace />} />
            <Route path="dashboard" element={<div>Student Dashboard (Coming Soon)</div>} />
            <Route path="assignments" element={<StudentAssignments />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
