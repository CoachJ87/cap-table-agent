import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface AddContributorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContributorAdded: () => void;
  sessionId?: string | null;
}

const AddContributorModal: React.FC<AddContributorModalProps> = ({ isOpen, onClose, onContributorAdded, sessionId }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddContributor = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('contributors').insert({
      name,
      session_id: sessionId || null,
    });
    if (error) {
      console.error('Error adding contributor:', error);
      alert('Failed to add contributor.');
    } else {
      setName('');
      onContributorAdded();
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Add New Contributor
          </h3>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              Enter the name of the contributor to generate a unique interview link.
            </p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-4 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Contributor's Name"
            />
          </div>

          <div className="mt-4">
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              onClick={handleAddContributor}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Link'}
            </button>
            <button
              type="button"
              className="ml-2 inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddContributorModal;
