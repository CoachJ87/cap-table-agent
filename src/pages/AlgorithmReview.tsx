import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Session {
  id: string;
  name: string;
  algorithm_text: string | null;
  collect_algorithm_feedback: boolean;
}

const AlgorithmReview = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [contributor, setContributor] = useState<any>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError('Invalid access link');
        setLoading(false);
        return;
      }

      // Fetch contributor
      const { data: contributorData, error: contributorError } = await supabase
        .from('contributors')
        .select('*')
        .eq('token', token)
        .single();

      if (contributorError || !contributorData) {
        setError('Invalid or expired access link');
        setLoading(false);
        return;
      }

      setContributor(contributorData);

      // If no session, redirect to allocation preferences
      if (!contributorData.session_id) {
        navigate(`/contribute/${token}`);
        return;
      }

      // If already acknowledged, redirect to allocation preferences
      if (contributorData.algorithm_acknowledged_at) {
        navigate(`/contribute/${token}`);
        return;
      }

      // Fetch session
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', contributorData.session_id)
        .single();

      if (sessionError || !sessionData) {
        // Session not found, redirect to allocation preferences
        navigate(`/contribute/${token}`);
        return;
      }

      // If no algorithm text, skip this step
      if (!sessionData.algorithm_text) {
        navigate(`/contribute/${token}`);
        return;
      }

      setSession(sessionData);
      setLoading(false);
    };

    fetchData();
  }, [token, navigate]);

  const handleContinue = async () => {
    if (!contributor?.id) return;

    setSubmitting(true);

    const updateData: any = {
      algorithm_acknowledged_at: new Date().toISOString(),
    };

    if (session?.collect_algorithm_feedback && feedback.trim()) {
      updateData.algorithm_feedback = feedback.trim();
    }

    await supabase
      .from('contributors')
      .update(updateData)
      .eq('id', contributor.id);

    navigate(`/contribute/${token}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Step 1 of 3: Review Algorithm</span>
            <span>~20-25 minutes total</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '33%' }}></div>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2">Allocation Algorithm</h1>
        <p className="text-gray-600 mb-6">
          Welcome, {contributor?.name}. Before you begin, please review the algorithm that will be used to determine token allocations based on your inputs and those of other contributors.
        </p>

        {/* Algorithm display card */}
        <div className="bg-white rounded-lg shadow-lg border-l-4 border-blue-500 mb-6">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-800">Allocation Methodology</h2>
            </div>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
                {session?.algorithm_text}
              </pre>
            </div>
          </div>
        </div>

        {/* Optional feedback section */}
        {session?.collect_algorithm_feedback && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-2">Feedback on Algorithm (Optional)</h2>
            <p className="text-sm text-gray-600 mb-4">
              If you have any thoughts, concerns, or suggestions about this allocation methodology, please share them below. Your feedback will be reviewed by leadership.
            </p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share any feedback on the allocation algorithm..."
              className="w-full border rounded-md p-3 text-sm"
              rows={4}
            />
          </div>
        )}

        {/* Continue button */}
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-4">
            By continuing, you acknowledge that you have reviewed the allocation algorithm and understand how your inputs will be used.
          </p>
          <button
            onClick={handleContinue}
            disabled={submitting}
            className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
              submitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {submitting ? 'Saving...' : 'I understand, continue to Allocation Preferences →'}
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-8">
          Questions? Reach out to Jonathan on Telegram: <a href="https://t.me/CoachJ87" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-500">@CoachJ87</a>
        </p>
      </div>
    </div>
  );
};

export default AlgorithmReview;
