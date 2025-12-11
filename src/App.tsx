import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Interview from './pages/Interview';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AllocationPreferences from './pages/AllocationPreferences';
import CharacterAccess from './pages/CharacterAccess';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/contribute/:token" element={<AllocationPreferences />} />
        <Route path="/interview/:token" element={<Interview />} />
        <Route path="/character/:token" element={<Navigate to="/contribute/:token" replace />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
