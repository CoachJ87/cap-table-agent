import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatInterface from '../components/ChatInterface';
import { supabase } from '../lib/supabase';
import type { Contributor } from '../components/ContributorTable';

const Interview: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [contributor, setContributor] = useState<Contributor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContributor = async () => {
      if (!token) {
        setError('No token provided.');
        setLoading(false);
        return;
      }

      // Check if allocation prefs have been submitted
      const { data: contributorData } = await supabase
        .from('contributors')
        .select('allocation_prefs_submitted_at')
        .eq('token', token)
        .single();

      // If allocation prefs not submitted, redirect to allocation prefs page
      if (!contributorData?.allocation_prefs_submitted_at) {
        navigate(`/contribute/${token}`);
        return;
      }

      const { data, error: dbError } = await supabase
        .from('contributors')
        .select('*')
        .eq('token', token)
        .single();

      if (dbError || !data) {
        setError('Invalid interview link.');
      } else {
        setContributor(data);
      }
      setLoading(false);
    };

    fetchContributor();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!contributor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Contributor not found.</p>
      </div>
    );
  }

  if (contributor.interview_completed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Thank you, this interview has already been completed.</p>
      </div>
    );
  }

  return <ChatInterface contributor={contributor} />;
};

export default Interview;
