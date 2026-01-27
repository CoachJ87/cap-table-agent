import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Session {
  id: string;
  name: string;
  algorithm_text: string | null;
  collect_algorithm_feedback: boolean;
  created_at: string;
}

interface SessionConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionSaved: () => void;
  editSession?: Session | null;
}

const SessionConfigModal: React.FC<SessionConfigModalProps> = ({
  isOpen,
  onClose,
  onSessionSaved,
  editSession,
}) => {
  const [name, setName] = useState('');
  const [algorithmText, setAlgorithmText] = useState('');
  const [collectFeedback, setCollectFeedback] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editSession) {
      setName(editSession.name);
      setAlgorithmText(editSession.algorithm_text || '');
      setCollectFeedback(editSession.collect_algorithm_feedback);
    } else {
      setName('');
      setAlgorithmText('');
      setCollectFeedback(false);
    }
  }, [editSession, isOpen]);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a session name');
      return;
    }

    setLoading(true);

    const sessionData = {
      name: name.trim(),
      algorithm_text: algorithmText.trim() || null,
      collect_algorithm_feedback: collectFeedback,
    };

    let error;
    if (editSession) {
      ({ error } = await supabase
        .from('sessions')
        .update(sessionData)
        .eq('id', editSession.id));
    } else {
      ({ error } = await supabase.from('sessions').insert(sessionData));
    }

    if (error) {
      console.error('Error saving session:', error);
      alert('Failed to save session.');
    } else {
      setName('');
      setAlgorithmText('');
      setCollectFeedback(false);
      onSessionSaved();
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
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            {editSession ? 'Edit Session' : 'Create New Session'}
          </h3>

          <div className="mt-4 space-y-4">
            {/* Session Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g., Mother Collective Q1 2025"
              />
            </div>

            {/* Algorithm Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allocation Algorithm
              </label>
              <p className="text-xs text-gray-500 mb-2">
                This text will be shown to contributors before they fill out their allocation preferences.
                Leave blank to skip the algorithm review step.
              </p>
              <textarea
                value={algorithmText}
                onChange={(e) => setAlgorithmText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                placeholder="Describe your allocation methodology here..."
                rows={12}
              />
              <p className="text-xs text-gray-400 mt-1">
                {algorithmText.length} characters
              </p>
            </div>

            {/* Collect Feedback Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="collectFeedback"
                checked={collectFeedback}
                onChange={(e) => setCollectFeedback(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="collectFeedback" className="ml-2 block text-sm text-gray-700">
                Collect feedback on the algorithm from contributors
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Saving...' : editSession ? 'Save Changes' : 'Create Session'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionConfigModal;
