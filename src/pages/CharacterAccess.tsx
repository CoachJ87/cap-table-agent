import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const CharacterAccess = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!token) {
        navigate('/');
        return;
      }

      // Check if allocation prefs have been submitted
      const { data: contributor } = await supabase
        .from('contributors')
        .select('allocation_prefs_submitted_at')
        .eq('token', token)
        .single();

      // Redirect to the appropriate page based on whether allocation prefs have been submitted
      const targetPath = contributor?.allocation_prefs_submitted_at 
        ? `/interview/${token}`
        : `/contribute/${token}`;
      
      navigate(targetPath, { replace: true });
    };

    checkAndRedirect();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecting...</p>
    </div>
  );
};

export default CharacterAccess;
