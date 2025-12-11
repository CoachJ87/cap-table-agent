import React, { useState, useEffect } from 'react';
import ContributorTable from '../components/ContributorTable';
import type { Contributor } from '../components/ContributorTable';
import AddContributorModal from '../components/AddContributorModal';
import TranscriptView from '../components/TranscriptView';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const AdminDashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContributor, setSelectedContributor] = useState<Contributor | null>(null);

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

  useEffect(() => {
    fetchContributors();
  }, []);

  useEffect(() => {
    console.log('Modal state changed to:', isModalOpen);
  }, [isModalOpen]);

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
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Contributor Dashboard</h1>
              <button
                onClick={() => {
                  console.log('Add Contributor clicked');
                  console.log('Modal state before open:', isModalOpen);
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Contributor
              </button>
            </div>
            {loading ? (
              <p>Loading contributors...</p>
            ) : (
              <ContributorTable 
                contributors={contributors} 
                onViewTranscript={handleViewTranscript} 
                onDelete={handleDeleteContributor} 
              />
            )}
          </div>
        </div>
      </div>
      {console.log('About to render modal, isModalOpen:', isModalOpen)}
      <AddContributorModal 
        isOpen={isModalOpen} 
        onClose={() => {
          console.log('Modal close button clicked');
          console.log('Modal state before close:', isModalOpen);
          setIsModalOpen(false);
        }} 
        onContributorAdded={handleContributorAdded} 
      />
      {selectedContributor && (
        <TranscriptView contributorName={selectedContributor.name} onClose={handleCloseTranscript} contributorId={selectedContributor.id} />
      )}
    </>
  );
};

export default AdminDashboard;
