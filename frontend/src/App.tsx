import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Roles from './pages/Roles';
import Classes from './pages/Classes';
import Teachers from './pages/Teachers';
import Students from './pages/Students';
import Profile from './pages/Profile';
import TeacherClasses from './pages/TeacherClasses';
import StudentAssignments from './pages/StudentAssignments';
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
            <Route path="teachers" element={<Teachers />} />
            <Route path="students" element={<Students />} />
            <Route path="reports" element={<Dashboard />} />
            <Route path="settings" element={<Dashboard />} />
          </Route>
        </Route>

        {/* Teacher Routes */}
        <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
          <Route path="/teacher" element={<MainLayout />}>
            <Route index element={<Navigate to="/teacher/classes" replace />} />
            <Route path="classes" element={<TeacherClasses />} />
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
