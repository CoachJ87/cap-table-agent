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

      // Fetch contributor with all relevant fields
      const { data: contributor, error } = await supabase
        .from('contributors')
        .select('interview_completed, allocation_prefs_submitted_at, algorithm_acknowledged_at, session_id')
        .eq('token', token)
        .single();

      if (error || !contributor) {
        navigate('/');
        return;
      }

      // 1. Interview completed? → /interview/{token} (shows completed state)
      if (contributor.interview_completed) {
        navigate(`/interview/${token}`, { replace: true });
        return;
      }

      // 2. Allocation prefs submitted? → /interview/{token}
      if (contributor.allocation_prefs_submitted_at) {
        navigate(`/interview/${token}`, { replace: true });
        return;
      }

      // 3. Algorithm acknowledged? → /contribute/{token}
      if (contributor.algorithm_acknowledged_at) {
        navigate(`/contribute/${token}`, { replace: true });
        return;
      }

      // 4. Check if session has algorithm_text
      if (contributor.session_id) {
        const { data: session } = await supabase
          .from('sessions')
          .select('algorithm_text')
          .eq('id', contributor.session_id)
          .single();

        if (session?.algorithm_text) {
          navigate(`/review/${token}`, { replace: true });
          return;
        }
      }

      // 5. Default → /contribute/{token}
      navigate(`/contribute/${token}`, { replace: true });
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
