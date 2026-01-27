import React, { useState, useEffect } from 'react';
import ContributorTable from '../components/ContributorTable';
import type { Contributor } from '../components/ContributorTable';
import AddContributorModal from '../components/AddContributorModal';
import TranscriptView from '../components/TranscriptView';
import SessionConfigModal from '../components/SessionConfigModal';
import type { Session } from '../components/SessionConfigModal';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContributor, setSelectedContributor] = useState<Contributor | null>(null);

  // Session state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  useEffect(() => {
    // Check authentication when dashboard loads
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (!session) {
        navigate('/admin');
        return;
      }

      if (error) {
        console.error('Auth error:', error);
        navigate('/admin');
      }
    };

    checkAuth();
  }, [navigate]);

  const fetchContributors = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('contributors').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching contributors:', error);
    } else {
      setContributors(data || []);
    }
    setLoading(false);
  };

  const fetchSessions = async () => {
    const { data, error } = await supabase.from('sessions').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching sessions:', error);
    } else {
      setSessions(data || []);
    }
  };

  useEffect(() => {
    fetchContributors();
    fetchSessions();
  }, []);

  // Filter contributors by selected session
  const filteredContributors = selectedSession
    ? contributors.filter((c) => c.session_id === selectedSession.id)
    : contributors;

  const handleViewTranscript = (contributor: Contributor) => {
    setSelectedContributor(contributor);
  };

  const handleCloseTranscript = () => {
    setSelectedContributor(null);
  };

  const handleContributorAdded = () => {
    setIsModalOpen(false);
    fetchContributors();
  };

  const handleSessionSaved = () => {
    setIsSessionModalOpen(false);
    setEditingSession(null);
    fetchSessions();
  };

  const handleEditSession = () => {
    if (selectedSession) {
      setEditingSession(selectedSession);
      setIsSessionModalOpen(true);
    }
  };

  const handleCreateSession = () => {
    setEditingSession(null);
    setIsSessionModalOpen(true);
  };

  const handleDeleteContributor = async (id: string, name: string) => {
    try {
      // Delete messages first due to foreign key constraint
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('contributor_id', id);

      if (messagesError) throw messagesError;

      // Then delete the contributor
      const { error: contributorError } = await supabase
        .from('contributors')
        .delete()
        .eq('id', id);

      if (contributorError) throw contributorError;

      // Refresh the list
      await fetchContributors();
      toast.success(`Successfully deleted ${name}`);
    } catch (error) {
      console.error('Error deleting contributor:', error);
      toast.error(`Failed to delete ${name}. Please try again.`);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Session Management Bar */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Session:</label>
                  <select
                    value={selectedSession?.id || ''}
                    onChange={(e) => {
                      const session = sessions.find((s) => s.id === e.target.value);
                      setSelectedSession(session || null);
                    }}
                    className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Contributors</option>
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleCreateSession}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  + New Session
                </button>

                {selectedSession && (
                  <button
                    onClick={handleEditSession}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Edit Session
                  </button>
                )}

                {selectedSession && (
                  <span className="text-xs text-gray-500">
                    {selectedSession.algorithm_text ? 'Has algorithm' : 'No algorithm'} |{' '}
                    {selectedSession.collect_algorithm_feedback ? 'Collecting feedback' : 'No feedback'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">
                {selectedSession ? `${selectedSession.name} Contributors` : 'All Contributors'}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({filteredContributors.length} {filteredContributors.length === 1 ? 'contributor' : 'contributors'})
                </span>
              </h1>
              <button
                onClick={() => {
                  setIsModalOpen(true);
                }}
                disabled={!selectedSession}
                title={!selectedSession ? 'Select a session first to add contributors' : ''}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  selectedSession
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Add Contributor
              </button>
            </div>

            {!selectedSession && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <p className="text-sm text-blue-700">
                  Select a session above to add contributors, or create a new session first.
                </p>
              </div>
            )}

            {loading ? (
              <p>Loading contributors...</p>
            ) : (
              <ContributorTable
                contributors={filteredContributors}
                onViewTranscript={handleViewTranscript}
                onDelete={handleDeleteContributor}
              />
            )}
          </div>
        </div>
      </div>
      <AddContributorModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
        onContributorAdded={handleContributorAdded}
        sessionId={selectedSession?.id}
      />
      <SessionConfigModal
        isOpen={isSessionModalOpen}
        onClose={() => {
          setIsSessionModalOpen(false);
          setEditingSession(null);
        }}
        onSessionSaved={handleSessionSaved}
        editSession={editingSession}
      />
      {selectedContributor && (
        <TranscriptView contributorName={selectedContributor.name} onClose={handleCloseTranscript} contributorId={selectedContributor.id} />
      )}
    </>
  );
};

export default AdminDashboard;
