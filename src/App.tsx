import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Interview from './pages/Interview';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AllocationPreferences from './pages/AllocationPreferences';
import CharacterAccess from './pages/CharacterAccess';
import AlgorithmReview from './pages/AlgorithmReview';
import { supabase } from './lib/supabase';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Debug: Check current auth state on app load
    const checkAuthState = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('🔍 App.js - Current auth session:', session ? 'Authenticated' : 'Not authenticated');
      console.log('🔍 App.js - User:', session?.user?.email || 'No user');
      console.log('🔍 App.js - Current URL:', window.location.href);
      if (error) console.error('🔍 App.js - Auth error:', error);
    };
    
    checkAuthState();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔍 App.js - Auth state changed:', event, session?.user?.email || 'No user');
    });
    
    return () => subscription.unsubscribe();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/contribute/:token" element={<AllocationPreferences />} />
        <Route path="/interview/:token" element={<Interview />} />
        <Route path="/character/:token" element={<CharacterAccess />} />
        <Route path="/review/:token" element={<AlgorithmReview />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/" element={<div className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Cap Table Agent</h1>
          <p className="text-gray-600 mb-4">Please use a specific access link to continue.</p>
          <div className="space-y-2">
            <p><strong>Admin:</strong> <a href="/admin" className="text-blue-600 hover:underline">Go to Admin Login</a></p>
            <p><strong>Contributors:</strong> Use your personal contribution link</p>
          </div>
        </div>} />
      </Routes>
    </Router>
  );
}

export default App;
