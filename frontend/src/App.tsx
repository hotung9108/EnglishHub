import { Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<MainLayout role="admin" />}>
        <Route index element={<Dashboard />} />
        <Route path="admin/accounts" element={<Accounts />} />
        <Route path="admin/accounts/profile" element={<Profile />} />
        <Route path="admin/roles" element={<Roles />} />
        <Route path="admin/classes" element={<Classes />} />
        <Route path="admin/teachers" element={<Teachers />} />
        <Route path="admin/students" element={<Students />} />
        <Route path="reports" element={<Dashboard />} />
        <Route path="settings" element={<Dashboard />} />
      </Route>
      <Route path="/teacher" element={<MainLayout role="teacher" />}>
        <Route path="classes" element={<TeacherClasses />} />
      </Route>
      <Route path="/student" element={<MainLayout role="student" />}>
      </Route>
    </Routes>
  );
}

export default App;
