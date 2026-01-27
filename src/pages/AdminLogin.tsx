import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Debug: Check if user is already authenticated when component loads
    const checkExistingAuth = async () => {
      console.log('🔍 AdminLogin - Component mounted, checking existing auth...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session) {
        console.log('🔍 AdminLogin - Found existing session:', session.user.email);
        console.log('🔍 AdminLogin - Auto-redirecting to dashboard');
        navigate('/admin/dashboard');
      } else {
        console.log('🔍 AdminLogin - No existing session, showing login form');
      }
      
      if (error) {
        console.error('🔍 AdminLogin - Error checking session:', error);
      }
    };
    
    checkExistingAuth();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt with email:', email);
    
    try {
      console.log('Logging in with:', { email });
      
      // Supabase auth call
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      // Log the response and any errors
      console.log('Auth response:', data);
      if (data.user && !error) {
        navigate('/admin/dashboard');
      }
      if (error) {
        console.error('Auth error:', error);
      }
      
      console.log('Login attempt completed');
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Admin Login</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
